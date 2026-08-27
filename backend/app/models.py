from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, JSON, Text, func
from sqlalchemy.orm import relationship
from .database import Base

class Well(Base):
    __tablename__ = "wells"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False, default="active")
    well_type = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    css_cycles = relationship("CssCycle", back_populates="well")
    recommendations = relationship("Recommendation", back_populates="well")

    def __repr__(self):
        return f"<Well(id={self.id}, name={self.name}, status={self.status})>"

class CssCycle(Base):
    __tablename__ = "css_cycles"
    
    id = Column(String, primary_key=True, index=True)
    well_id = Column(String, ForeignKey("wells.id"), nullable=False)
    cycle_number = Column(Integer, nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True))
    steam_injected = Column(Float, nullable=False, default=0.0)
    oil_produced = Column(Float, nullable=False, default=0.0)
    status = Column(String, nullable=False)
    
    well = relationship("Well", back_populates="css_cycles")

    def __repr__(self):
        return f"<CssCycle(id={self.id}, well_id={self.well_id}, cycle_number={self.cycle_number})>"

class Telemetry(Base):
    __tablename__ = "telemetry"
    
    ts = Column(DateTime(timezone=True), primary_key=True)
    well_id = Column(String, ForeignKey("wells.id"), primary_key=True)
    sensor_name = Column(String, primary_key=True)
    value = Column(Float, nullable=False)
    unit = Column(String)

    def __repr__(self):
        return f"<Telemetry(ts={self.ts}, well_id={self.well_id}, sensor_name={self.sensor_name}, value={self.value})>"

class SrpSample(Base):
    __tablename__ = "srp_sample"
    
    ts = Column(DateTime(timezone=True), primary_key=True)
    well_id = Column(String, ForeignKey("wells.id"), primary_key=True)
    pump_speed = Column(Float)
    stroke_length = Column(Float)
    motor_current = Column(Float)
    motor_power = Column(Float)

    def __repr__(self):
        return f"<SrpSample(ts={self.ts}, well_id={self.well_id})>"

class DynamometerCard(Base):
    __tablename__ = "dynamometer_card"
    
    ts = Column(DateTime(timezone=True), primary_key=True)
    well_id = Column(String, ForeignKey("wells.id"), primary_key=True)
    card_type = Column(String, nullable=False)
    position = Column(JSON, nullable=False)
    load = Column(JSON, nullable=False)
    diagnosis = Column(String)

    def __repr__(self):
        return f"<DynamometerCard(ts={self.ts}, well_id={self.well_id}, card_type={self.card_type})>"

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(String, primary_key=True, index=True)
    well_id = Column(String, ForeignKey("wells.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))
    
    well = relationship("Well", back_populates="recommendations")

    def __repr__(self):
        return f"<Recommendation(id={self.id}, well_id={self.well_id}, status={self.status})>"

class AuditEvent(Base):
    __tablename__ = "audit_events"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    action = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)
    resource_id = Column(String, nullable=False)
    details = Column(JSON)
    ts = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<AuditEvent(id={self.id}, action={self.action}, user_id={self.user_id})>"

class ModelVersion(Base):
    __tablename__ = "model_versions"
    
    id = Column(String, primary_key=True, index=True)
    model_name = Column(String, nullable=False)
    version = Column(String, nullable=False)
    path = Column(String, nullable=False)
    is_active = Column(Boolean, default=False)
    metrics = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<ModelVersion(model_name={self.model_name}, version={self.version}, is_active={self.is_active})>"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<User(username={self.username}, role={self.role})>"

class DatasetVersion(Base):
    __tablename__ = "dataset_versions"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    start_ts = Column(DateTime(timezone=True), nullable=False)
    end_ts = Column(DateTime(timezone=True), nullable=False)
    row_count = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<DatasetVersion(name={self.name}, row_count={self.row_count})>"
