"""Initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-26 15:52:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # users table
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default='user'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # well table
    op.create_table(
        'well',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('autonomy_tier', sa.String(), server_default='advisory'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # css_cycle table
    op.create_table(
        'css_cycle',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('well_id', sa.String(), sa.ForeignKey('well.id', ondelete='CASCADE'), nullable=False),
        sa.Column('phase', sa.String(), nullable=False),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('params', JSONB, nullable=True),
    )
    op.create_index('ix_css_cycle_well_id', 'css_cycle', ['well_id'])
    
    # telemetry table
    op.create_table(
        'telemetry',
        sa.Column('ts', sa.DateTime(timezone=True), nullable=False),
        sa.Column('well_id', sa.String(), sa.ForeignKey('well.id', ondelete='CASCADE'), nullable=False),
        sa.Column('metric', sa.String(), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('ts', 'well_id', 'metric')
    )
    op.execute("SELECT create_hypertable('telemetry', 'ts', if_not_exists => TRUE);")
    op.create_index('ix_telemetry_well_id_ts', 'telemetry', ['well_id', 'ts'])

    # srp_sample table
    op.create_table(
        'srp_sample',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('ts', sa.DateTime(timezone=True), nullable=False),
        sa.Column('well_id', sa.String(), sa.ForeignKey('well.id', ondelete='CASCADE'), nullable=False),
        sa.Column('data', JSONB, nullable=False),
    )
    op.create_index('ix_srp_sample_well_id', 'srp_sample', ['well_id'])
    
    # dynamometer_card table
    op.create_table(
        'dynamometer_card',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('ts', sa.DateTime(timezone=True), nullable=False),
        sa.Column('well_id', sa.String(), sa.ForeignKey('well.id', ondelete='CASCADE'), nullable=False),
        sa.Column('surface_card', JSONB, nullable=False),
        sa.Column('downhole_card', JSONB, nullable=True),
        sa.Column('classification', sa.String(), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
    )
    op.create_index('ix_dyno_card_well_id_ts', 'dynamometer_card', ['well_id', 'ts'])

    # recommendation table
    op.create_table(
        'recommendation',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('well_id', sa.String(), sa.ForeignKey('well.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.Column('status', sa.String(), server_default='pending'),
        sa.Column('metadata_json', JSONB, nullable=True),
    )
    op.create_index('ix_recommendation_well_id', 'recommendation', ['well_id'])

    # audit_event table
    op.create_table(
        'audit_event',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('ts', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('resource_id', sa.String(), nullable=True),
        sa.Column('details', JSONB, nullable=True),
    )

    # model_version table
    op.create_table(
        'model_version',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('model_name', sa.String(), nullable=False),
        sa.Column('version', sa.String(), nullable=False),
        sa.Column('deployed_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('metrics', JSONB, nullable=True),
    )
    
    # dataset_version table
    op.create_table(
        'dataset_version',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('version', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    
    # feature_cache table
    op.create_table(
        'feature_cache',
        sa.Column('key', sa.String(), primary_key=True),
        sa.Column('value', JSONB, nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
    )

def downgrade():
    op.drop_table('feature_cache')
    op.drop_table('dataset_version')
    op.drop_table('model_version')
    op.drop_table('audit_event')
    op.drop_table('recommendation')
    op.drop_table('dynamometer_card')
    op.drop_table('srp_sample')
    op.drop_table('telemetry')
    op.drop_table('css_cycle')
    op.drop_table('well')
    op.drop_table('users')
