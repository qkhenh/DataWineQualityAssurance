from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class Batch(BaseModel):
    batch_id: int
    line_id: int
    quantity: int = 0
    produced_date: Optional[datetime] = None
    
