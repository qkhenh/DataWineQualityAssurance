from enum import Enum
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Optional

class UserRole(str, Enum):
    MANAGER = "manager"
    ENGINEER = "engineer"
    TESTER = "tester"
    
class User(BaseModel):
    user_id: Optional[int] = None
    username: str
    password: str
    email: str
    first_name: str
    last_name: str
    exp: Optional[str] = None   
    role: UserRole
    warehouse_id: Optional[int] = None
    
    