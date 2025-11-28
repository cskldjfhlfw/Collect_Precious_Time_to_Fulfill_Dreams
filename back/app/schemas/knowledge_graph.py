from typing import Any, Optional

from pydantic import BaseModel

from app.schemas.common import BaseSchema


class GraphNode(BaseSchema):
    id: str
    label: str
    type: str
    properties: dict[str, Any]


class GraphEdge(BaseSchema):
    source: str
    target: str
    relationship: str
    weight: float = 1.0


class GraphStats(BaseSchema):
    total_nodes: int
    total_edges: int
    node_types: dict[str, int]


class KnowledgeGraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    stats: GraphStats


class KeyRelationship(BaseSchema):
    source: str
    target: str
    relationship: str
    strength: int
    type: str


class Domain(BaseSchema):
    name: str
    entities: int
    connections: int
    growth: str


class RelationshipAnalysisResponse(BaseModel):
    key_relationships: list[KeyRelationship]
    domains: list[Domain]


class EntityCreate(BaseSchema):
    label: str
    type: str
    properties: Optional[dict[str, Any]] = None


class EntityResponse(BaseModel):
    id: str
    label: str
    type: str
    properties: dict[str, Any]
    message: str
