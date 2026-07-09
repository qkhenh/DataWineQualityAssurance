
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Warehouse(BaseModel):
    warehouse_id: Optional[int] = None
    categories: Optional[str] = None
    owner_id: Optional[int] = None
    invitation_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    
class InvitationToken(BaseModel):
    token: str
    warehouse_id: int
    created_by: int
    expires_at: datetime
    
    def is_expired(self):
        if self.expires_at < datetime.utcnow(): return True
        return False