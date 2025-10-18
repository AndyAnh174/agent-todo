from datetime import datetime
from typing import Dict, Any, List, Optional
import logging

from sqlalchemy.orm import Session

from ..models.automation_rule import AutomationRule
from ..models.todo import Todo
from ..models.user import User
from ..models.group import Group
from ..models.tag import Tag
from ..models.notification import Notification, NotificationStatus
from ..services.email_service import email_service

logger = logging.getLogger(__name__)


class AutomationEngine:
    def __init__(self, db: Session):
        self.db = db

    def evaluate_conditions(self, rule: AutomationRule, context: Dict[str, Any]) -> bool:
        """
        Evaluate if rule conditions match the context
        """
        try:
            conditions = rule.conditions
            
            # Check if content contains keywords
            if "if_content_contains" in conditions:
                keywords = conditions["if_content_contains"]
                todo_title = context.get("todo_title", "").lower()
                todo_description = context.get("todo_description", "").lower()
                
                for keyword in keywords:
                    if keyword.lower() in todo_title or keyword.lower() in todo_description:
                        return True
                return False
            
            # Check if tag matches
            if "if_tag_is" in conditions:
                required_tag = conditions["if_tag_is"]
                todo_tags = context.get("todo_tags", [])
                return required_tag in todo_tags
            
            # Check if due date is within range
            if "if_due_within_days" in conditions:
                days = conditions["if_due_within_days"]
                due_time = context.get("due_time")
                if due_time:
                    from datetime import timedelta
                    now = datetime.utcnow()
                    if due_time <= now + timedelta(days=days):
                        return True
                return False
            
            # Check if todo is important
            if "if_important" in conditions:
                is_important = context.get("is_important", False)
                return is_important == conditions["if_important"]
            
            # Default: rule matches
            return True
            
        except Exception as e:
            logger.error(f"Error evaluating conditions for rule {rule.id}: {str(e)}")
            return False

    def execute_action(self, rule: AutomationRule, context: Dict[str, Any]) -> bool:
        """
        Execute rule action
        """
        try:
            action = rule.action
            todo_id = context.get("todo_id")
            
            if not todo_id:
                logger.error("No todo_id in context for action execution")
                return False
            
            # Get todo
            todo = self.db.query(Todo).filter(Todo.id == todo_id).first()
            if not todo:
                logger.error(f"Todo {todo_id} not found")
                return False
                
            # Move to group
            if "move_to_group" in action:
                group_id = action["move_to_group"]
                group = self.db.query(Group).filter(Group.id == group_id).first()
                if group:
                    todo.group_id = group_id
                    logger.info(f"Moved todo {todo_id} to group {group.name}")
            
            # Set priority (important)
            if "set_priority" in action:
                priority = action["set_priority"]
                if priority == "high":
                    todo.is_important = True
                    logger.info(f"Set todo {todo_id} as important")
                elif priority == "low":
                    todo.is_important = False
                    logger.info(f"Set todo {todo_id} as not important")
            
            # Add tag
            if "add_tag" in action:
                tag_name = action["add_tag"]
                # Find or create tag
                tag = self.db.query(Tag).filter(Tag.name == tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    self.db.add(tag)
                    self.db.flush()
                
                # Add tag to todo (if not already exists)
                from ..models.todo_tag import TodoTag
                existing = self.db.query(TodoTag).filter(
                    TodoTag.todo_id == todo_id,
                    TodoTag.tag_id == tag.id
                ).first()
                
                if not existing:
                    todo_tag = TodoTag(todo_id=todo_id, tag_id=tag.id)
                    self.db.add(todo_tag)
                    logger.info(f"Added tag {tag_name} to todo {todo_id}")
            
            # Send notification
            if "send_notification" in action:
                notification_config = action["send_notification"]
                self._create_notification(todo, notification_config)
            
            # Commit changes
            self.db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error executing action for rule {rule.id}: {str(e)}")
            self.db.rollback()
            return False

    def _create_notification(self, todo: Todo, notification_config: Dict[str, Any]):
        """
        Create notification for todo
        """
        try:
            # Get user
            user = self.db.query(User).filter(User.id == todo.user_id).first()
            if not user:
                return
            
            # Create notification
            notification = Notification(
                todo_id=todo.id,
                user_id=user.id,
                notify_at=datetime.utcnow(),
                subject=notification_config.get("subject", f"Thông báo: {todo.title}"),
                content=notification_config.get("content", f"Công việc '{todo.title}' đã được cập nhật."),
                status=NotificationStatus.PENDING
            )
            
            self.db.add(notification)
            self.db.commit()
            
            logger.info(f"Created notification for todo {todo.id}")
            
        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}")

    def trigger_automation(self, trigger: str, context: Dict[str, Any]) -> int:
        """
        Main entry point for automation
        Returns number of rules executed
        """
        try:
            # Get active rules for this trigger
            rules = self.db.query(AutomationRule).filter(
                AutomationRule.trigger == trigger,
                AutomationRule.is_active == True
            ).order_by(AutomationRule.priority.desc()).all()
            
            executed_count = 0
            
            for rule in rules:
                try:
                    # Evaluate conditions
                    if self.evaluate_conditions(rule, context):
                        # Execute action
                        if self.execute_action(rule, context):
                            executed_count += 1
                            logger.info(f"Executed rule {rule.name} for trigger {trigger}")
                        else:
                            logger.warning(f"Failed to execute rule {rule.name}")
                    else:
                        logger.debug(f"Rule {rule.name} conditions not met")
                        
                except Exception as e:
                    logger.error(f"Error executing rule {rule.id}: {str(e)}")
                    continue
            
            logger.info(f"Automation triggered for {trigger}: {executed_count} rules executed")
            return executed_count
            
        except Exception as e:
            logger.error(f"Error triggering automation for {trigger}: {str(e)}")
            return 0
