from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class Alert(BaseModel):
    alert_id: Optional[int] = None
    warehouse_id: int
    product_id: Optional[str] = None
    title: str
    description: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AlertSetting(BaseModel):
    setting_id: Optional[int] = None
    warehouse_id: int
    metric: str
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    enabled: bool = True
    
    def check_violation(self, value: float) -> bool:
        return (self.min_value is not None and value < self.min_value) or (self.max_value is not None and value > self.max_value)





























