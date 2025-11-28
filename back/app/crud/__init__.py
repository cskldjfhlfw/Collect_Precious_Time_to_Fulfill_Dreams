"""CRUD operations for database models."""

from .base import CRUDBase
from .papers import crud_paper
from .patents import crud_patent
from .projects import crud_project
from .resources import crud_resource
from .software_copyrights import crud_software_copyright
from .competitions import crud_competition
from .conferences import crud_conference
from .cooperations import crud_cooperation

__all__ = [
    "CRUDBase",
    "crud_paper",
    "crud_patent", 
    "crud_project",
    "crud_resource",
    "crud_software_copyright",
    "crud_competition",
    "crud_conference",
    "crud_cooperation",
]
