from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_session
from app.db.neo4j import get_session as get_neo4j_session
from app.models.tables import Paper, Project, Patent, Resource, PaperAuthor, Relationship
from app.schemas.knowledge_graph import (
    KnowledgeGraphResponse,
    RelationshipAnalysisResponse,
    GraphNode,
    GraphEdge,
    GraphStats,
    KeyRelationship,
    Domain,
    EntityCreate,
    EntityResponse
)

router = APIRouter(prefix="/knowledge-graph", tags=["Knowledge Graph"])


@router.get("/nodes", response_model=KnowledgeGraphResponse)
async def get_knowledge_graph_nodes(
    type: Optional[str] = Query(None, description="节点类型筛选"),
    limit: int = Query(100, description="返回数量限制"),
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取知识图谱节点和边数据"""
    
    nodes = []
    edges = []
    
    # 获取论文节点
    papers_query = select(Paper).limit(limit // 4 if not type or type == "paper" else 0)
    if type == "paper":
        papers_query = select(Paper).limit(limit)
    
    papers_result = await db.execute(papers_query)
    papers = papers_result.scalars().all()
    
    for paper in papers:
        nodes.append(GraphNode(
            id=f"paper_{paper.id}",
            label=paper.title,
            type="paper",
            properties={
                "author": paper.authors.get("first_author", "未知") if paper.authors else "未知",
                "year": paper.publish_date.year if paper.publish_date else 2024,
                "citations": paper.citation_count,
                "status": paper.status
            }
        ))
    
    # 获取项目节点
    projects_query = select(Project).limit(limit // 4 if not type or type == "project" else 0)
    if type == "project":
        projects_query = select(Project).limit(limit)
    
    projects_result = await db.execute(projects_query)
    projects = projects_result.scalars().all()
    
    for project in projects:
        nodes.append(GraphNode(
            id=f"project_{project.id}",
            label=project.name,
            type="project",
            properties={
                "principal": project.principal or "未知",
                "status": project.status,
                "budget": float(project.budget) if project.budget else 0,
                "progress": project.progress_percent
            }
        ))
    
    # 获取专利节点
    patents_query = select(Patent).limit(limit // 4 if not type or type == "patent" else 0)
    if type == "patent":
        patents_query = select(Patent).limit(limit)
    
    patents_result = await db.execute(patents_query)
    patents = patents_result.scalars().all()
    
    for patent in patents:
        nodes.append(GraphNode(
            id=f"patent_{patent.id}",
            label=patent.name,
            type="patent",
            properties={
                "patent_number": patent.patent_number,
                "status": patent.status,
                "type": patent.patent_type,
                "field": patent.technology_field or "未知"
            }
        ))
    
    # 获取作者节点（从论文作者表）
    authors_query = select(PaperAuthor.author_name, func.count(PaperAuthor.paper_id).label("paper_count")).group_by(PaperAuthor.author_name).limit(20)
    authors_result = await db.execute(authors_query)
    authors = authors_result.all()
    
    for author in authors:
        nodes.append(GraphNode(
            id=f"author_{hash(author.author_name) % 100000}",
            label=author.author_name,
            type="author",
            properties={
                "paper_count": author.paper_count,
                "h_index": min(author.paper_count, 20)  # 简化的h指数计算
            }
        ))
    
    # 创建关系边
    # 作者-论文关系
    author_paper_query = select(PaperAuthor).limit(50)
    author_paper_result = await db.execute(author_paper_query)
    author_papers = author_paper_result.scalars().all()
    
    for ap in author_papers:
        edges.append(GraphEdge(
            source=f"author_{hash(ap.author_name) % 100000}",
            target=f"paper_{ap.paper_id}",
            relationship="authored",
            weight=1.0
        ))
    
    # 项目-论文关系（基于相关项目字段）
    for paper in papers[:20]:  # 限制数量避免过多边
        if paper.related_projects:
            for project in projects[:10]:
                if str(project.id) in str(paper.related_projects):
                    edges.append(GraphEdge(
                        source=f"project_{project.id}",
                        target=f"paper_{paper.id}",
                        relationship="produces",
                        weight=0.8
                    ))
    
    # 统计信息
    stats = GraphStats(
        total_nodes=len(nodes),
        total_edges=len(edges),
        node_types={
            "papers": len([n for n in nodes if n.type == "paper"]),
            "authors": len([n for n in nodes if n.type == "author"]),
            "projects": len([n for n in nodes if n.type == "project"]),
            "patents": len([n for n in nodes if n.type == "patent"])
        }
    )
    
    return KnowledgeGraphResponse(
        nodes=nodes,
        edges=edges,
        stats=stats
    )


@router.get("/graph", response_model=KnowledgeGraphResponse)
async def get_knowledge_graph_from_neo4j(
    type: Optional[str] = Query(None, description="节点类型（Neo4j标签）筛选"),
    limit: int = Query(200, description="返回节点和关系数量上限"),
    session=Depends(get_neo4j_session),
) -> Any:
    """从 Neo4j 获取知识图谱节点和边数据。

    - 当提供 type 时，会优先匹配具有该标签的节点；
    - 未提供 type 时，返回混合类型的节点和关系。
    """

    nodes: dict[str, GraphNode] = {}
    edges: list[GraphEdge] = []

    # Cypher 查询：按可选标签筛选节点
    node_query = """
    MATCH (n)
    WHERE $type IS NULL OR $type IN labels(n)
    RETURN n
    LIMIT $limit
    """

    edge_query = """
    MATCH (source)-[r]->(target)
    WHERE $type IS NULL OR $type IN labels(source) OR $type IN labels(target)
    RETURN source, r, target
    LIMIT $limit
    """

    async with session as neo_session:
        # 加载节点
        node_result = await neo_session.run(node_query, type=type, limit=limit)
        async for record in node_result:
            neo_node = record["n"]
            # Neo4j Node 对象可以像字典一样访问属性
            properties = dict(neo_node)

            # 使用 element_id 作为稳定的节点 ID，如果不可用则退回到 id
            raw_id = getattr(neo_node, "element_id", None) or getattr(neo_node, "id", None)
            node_id = str(raw_id)

            labels = list(getattr(neo_node, "labels", []))
            node_type = labels[0].lower() if labels else "unknown"

            # 尝试从常见字段中选择一个合适的显示名称
            label = (
                properties.get("name")
                or properties.get("title")
                or properties.get("label")
                or node_id
            )

            nodes[node_id] = GraphNode(
                id=node_id,
                label=str(label),
                type=node_type,
                properties=properties,
            )

        # 加载关系
        edge_result = await neo_session.run(edge_query, type=type, limit=limit)
        async for record in edge_result:
            source_node = record["source"]
            target_node = record["target"]
            rel = record["r"]

            source_raw_id = getattr(source_node, "element_id", None) or getattr(source_node, "id", None)
            target_raw_id = getattr(target_node, "element_id", None) or getattr(target_node, "id", None)
            source_id = str(source_raw_id)
            target_id = str(target_raw_id)

            # 确保关系两端的节点也在节点集合中
            for neo_node, node_id in ((source_node, source_id), (target_node, target_id)):
                if node_id not in nodes:
                    props = dict(neo_node)
                    labels = list(getattr(neo_node, "labels", []))
                    node_type = labels[0].lower() if labels else "unknown"
                    label = (
                        props.get("name")
                        or props.get("title")
                        or props.get("label")
                        or node_id
                    )
                    nodes[node_id] = GraphNode(
                        id=node_id,
                        label=str(label),
                        type=node_type,
                        properties=props,
                    )

            relationship_type = getattr(rel, "type", None) or "RELATED_TO"

            edges.append(
                GraphEdge(
                    source=source_id,
                    target=target_id,
                    relationship=str(relationship_type),
                    weight=1.0,
                )
            )

    # 统计信息
    node_types: dict[str, int] = {}
    for node in nodes.values():
        node_types[node.type] = node_types.get(node.type, 0) + 1

    stats = GraphStats(
        total_nodes=len(nodes),
        total_edges=len(edges),
        node_types=node_types,
    )

    return KnowledgeGraphResponse(
        nodes=list(nodes.values()),
        edges=edges,
        stats=stats,
    )


@router.get("/relationships", response_model=RelationshipAnalysisResponse)
async def get_relationship_analysis(
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取关系分析数据"""
    
    # 获取关键关系
    key_relationships = []
    
    # 查找高产作者
    top_authors_query = select(
        PaperAuthor.author_name,
        func.count(PaperAuthor.paper_id).label("paper_count")
    ).group_by(PaperAuthor.author_name).order_by(func.count(PaperAuthor.paper_id).desc()).limit(5)
    
    top_authors_result = await db.execute(top_authors_query)
    top_authors = top_authors_result.all()
    
    for author in top_authors:
        key_relationships.append(KeyRelationship(
            source=author.author_name,
            target="学术研究",
            relationship="核心研究者",
            strength=min(author.paper_count * 10, 100),
            type="人员-领域"
        ))
    
    # 查找活跃项目负责人
    active_projects_query = select(
        Project.principal,
        func.count(Project.id).label("project_count")
    ).where(Project.principal.isnot(None)).group_by(Project.principal).order_by(func.count(Project.id).desc()).limit(3)
    
    active_projects_result = await db.execute(active_projects_query)
    active_projects = active_projects_result.all()
    
    for project_leader in active_projects:
        key_relationships.append(KeyRelationship(
            source=project_leader.principal,
            target="项目管理",
            relationship="项目负责人",
            strength=min(project_leader.project_count * 15, 100),
            type="人员-项目"
        ))
    
    # 领域分析
    domains = []
    
    # 论文领域统计
    papers_count_query = select(func.count(Paper.id))
    papers_count = (await db.execute(papers_count_query)).scalar() or 0
    
    domains.append(Domain(
        name="学术论文",
        entities=papers_count,
        connections=papers_count * 2,  # 假设每篇论文有2个连接
        growth="+15%"
    ))
    
    # 项目领域统计
    projects_count_query = select(func.count(Project.id))
    projects_count = (await db.execute(projects_count_query)).scalar() or 0
    
    domains.append(Domain(
        name="科研项目",
        entities=projects_count,
        connections=projects_count * 3,  # 假设每个项目有3个连接
        growth="+12%"
    ))
    
    # 专利领域统计
    patents_count_query = select(func.count(Patent.id))
    patents_count = (await db.execute(patents_count_query)).scalar() or 0
    
    domains.append(Domain(
        name="知识产权",
        entities=patents_count,
        connections=patents_count * 1,  # 假设每个专利有1个连接
        growth="+8%"
    ))
    
    return RelationshipAnalysisResponse(
        key_relationships=key_relationships,
        domains=domains
    )


@router.post("/entities", response_model=EntityResponse)
async def create_entity(
    entity: EntityCreate,
    session=Depends(get_neo4j_session),
) -> Any:
    """创建新的实体节点到 Neo4j 知识图谱中"""
    
    async with session as neo_session:
        # 构建Cypher查询来创建节点
        # 使用动态标签和属性
        properties = entity.properties or {}
        properties["label"] = entity.label
        
        # 创建节点的Cypher查询
        create_query = f"""
        CREATE (n:{entity.type.capitalize()} $properties)
        RETURN n
        """
        
        result = await neo_session.run(create_query, properties=properties)
        record = await result.single()
        
        if not record:
            raise HTTPException(status_code=500, detail="创建实体失败")
        
        created_node = record["n"]
        node_id = str(getattr(created_node, "element_id", None) or getattr(created_node, "id", None))
        
        return EntityResponse(
            id=node_id,
            label=entity.label,
            type=entity.type,
            properties=properties,
            message="实体创建成功"
        )
