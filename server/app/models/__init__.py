from sqlalchemy.orm import declarative_base


Base = declarative_base()

# Ensure all models are imported so Table metadata and FKs are registered
# before mappers configure relationships
from . import user as _user  # noqa: F401
from . import group as _group  # noqa: F401
from . import tag as _tag  # noqa: F401
from . import todo as _todo  # noqa: F401
from . import todo_tag as _todo_tag  # noqa: F401
from . import notification as _notification  # noqa: F401
from . import user_preference as _user_preference  # noqa: F401
from . import automation_rule as _automation_rule  # noqa: F401


