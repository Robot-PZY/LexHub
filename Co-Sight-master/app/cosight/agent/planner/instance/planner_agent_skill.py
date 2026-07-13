# Copyright 2025 ZTE Corporation.
# All Rights Reserved.
#
#    Licensed under the Apache License, Version 2.0 (the "License"); you may
#    not use this file except in compliance with the License. You may obtain
#    a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#    License for the specific language governing permissions and limitations
#    under the License.

from app.agent_dispatcher.infrastructure.entity.SkillFunction import SkillFunction
def create_plan_skill():
    return {
        'skill_name': 'create_plan',
        'skill_type': "function",
        'display_name_zh': '创建计划',
        'display_name_en': 'Create Plan',
        'description_zh': '创建一个新的任务计划',
        'description_en': 'Create a new task plan',
        'semantic_apis': ["api_planning"],
        'function': SkillFunction(
            id='8d7f9a2b-c6e3-4f8d-b1a2-3e4f5d6c7b8a',
            name='app.cosight.planner.plan_toolkit.PlanToolkit.create_plan',
            description_zh='创建一个包含标题、步骤和依赖关系的新计划',
            description_en='Create a new plan with title, steps and dependencies',
            parameters={
                "type": "object",
                "properties": {
                    'title': {
                        'type': 'string',
                        'description_zh': '计划的标题',
                        'description_en': 'Title of the plan'
                    },
                    'steps': {
                        'type': 'array',
                        'items': {
                            'type': 'string'
                        },
                        'description_zh': '计划的步骤列表',
                        'description_en': 'List of steps for the plan'
                    },
                    'dependencies': {
                        'type': 'object',
                        'additionalProperties': {
                            'type': 'array',
                            'items': {
                                'type': 'integer'
                            }
                        },
                        'description_zh': '步骤之间的依赖关系，例如 {1: [0]} 表示步骤1依赖于步骤0',
                        'description_en': 'Dependencies between steps, e.g. {1: [0]} means step 1 depends on step 0',
                        'default': None
                    },
                    'agent_ids': {
                        'type': 'array', 'items': {'type': 'string'},
                        'description_zh': '与 steps 等长的专业智能体 ID 列表',
                        'description_en': 'Specialist agent id for each step'
                    },
                    'parallel_groups': {
                        'type': 'object', 'additionalProperties': {'type': 'string'},
                        'description_zh': '步骤索引到并行组名称的映射'
                    },
                    'conditions': {
                        'type': 'object', 'additionalProperties': {'type': 'string'},
                        'description_zh': '步骤索引到执行条件的映射'
                    },
                    'expected_artifacts': {
                        'type': 'array', 'items': {'type': 'string'},
                        'description_zh': '与 steps 等长的预期阶段产物类型'
                    },
                    'selected_agents': {
                        'type': 'array', 'items': {'type': 'string'},
                        'description_zh': '本次任务选中的智能体 ID'
                    },
                    'skipped_agents': {
                        'type': 'array', 'items': {'type': 'object'},
                        'description_zh': '未选智能体及跳过原因'
                    },
                    'scenario': {'type': 'string'},
                    'target_output': {'type': 'string'},
                    'risk_level': {'type': 'string', 'enum': ['low', 'medium', 'high']}
                },
                'required': ['title', 'steps', 'dependencies', 'agent_ids', 'expected_artifacts', 'selected_agents', 'skipped_agents', 'scenario', 'target_output', 'risk_level']
            }
        )
    }



def update_plan_skill():
    return {
        'skill_name': 'update_plan',
        'skill_type': "function",
        'display_name_zh': '更新计划',
        'display_name_en': 'Update Plan',
        'description_zh': '更新现有的任务计划',
        'description_en': 'Update an existing task plan',
        'semantic_apis': ["api_planning"],
        'function': SkillFunction(
            id='7e8f9a2b-c6e3-4f8d-b1a2-3e4f5d6c7b8b',
            name='app.cosight.planner.plan_toolkit.PlanToolkit.update_plan',
            description_zh='更新计划的标题、步骤或依赖关系',
            description_en='Update the title, steps or dependencies of a plan',
            parameters={
                "type": "object",
                "properties": {
                    'title': {
                        'type': 'string',
                        'description_zh': '新的计划标题',
                        'description_en': 'New title for the plan'
                    },
                    'steps': {
                        'type': 'array',
                        'items': {
                            'type': 'string'
                        },
                        'description_zh': '新的步骤列表',
                        'description_en': 'New list of steps for the plan'
                    },
                    'dependencies': {
                        'type': 'object',
                        'additionalProperties': {
                            'type': 'array',
                            'items': {
                                'type': 'integer'
                            }
                        },
                        'description_zh': '新的步骤依赖关系',
                        'description_en': 'New dependencies between steps'
                    },
                    'agent_ids': {'type': 'array', 'items': {'type': 'string'}},
                    'parallel_groups': {'type': 'object', 'additionalProperties': {'type': 'string'}},
                    'conditions': {'type': 'object', 'additionalProperties': {'type': 'string'}},
                    'expected_artifacts': {'type': 'array', 'items': {'type': 'string'}},
                    'selected_agents': {'type': 'array', 'items': {'type': 'string'}},
                    'skipped_agents': {'type': 'array', 'items': {'type': 'object'}},
                    'scenario': {'type': 'string'},
                    'target_output': {'type': 'string'},
                    'risk_level': {'type': 'string', 'enum': ['low', 'medium', 'high']}
                },
                'required': []
            }
        )
    }
