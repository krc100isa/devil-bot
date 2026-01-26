from pydantic import BaseModel, ConfigDict


class OrganizationBase(BaseModel):
    name: str
    slug: str


class OrganizationRead(OrganizationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
