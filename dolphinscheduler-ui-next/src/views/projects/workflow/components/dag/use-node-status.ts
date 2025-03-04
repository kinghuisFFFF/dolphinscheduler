/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Ref } from 'vue'
import { render, h, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Graph } from '@antv/x6'
import { tasksState } from '@/utils/common'
import { NODE, NODE_STATUS_MARKUP } from './dag-config'
import { queryTaskListByProcessId } from '@/service/modules/process-instances'
import NodeStatus from '@/views/projects/workflow/components/dag/dag-node-status'

interface Options {
  graph: Ref<Graph | undefined>
}

/**
 * Node status and tooltip
 */
export function useNodeStatus(options: Options) {
  const { graph } = options
  const route = useRoute()
  const taskList = ref<Array<Object>>([])

  const { t } = useI18n()

  const setNodeStatus = (code: string, state: string, taskInstance: any) => {
    const stateProps = tasksState(t)[state]
    const node = graph.value?.getCellById(code)
    if (node) {
      // Destroy the previous dom
      node.removeMarkup()
      node.setMarkup(NODE.markup.concat(NODE_STATUS_MARKUP))
      const nodeView = graph.value?.findViewByCell(node)
      const el = nodeView?.find('div')[0]
      const a = h(NodeStatus, {
        t,
        taskInstance,
        stateProps
      })

      render(a, el as HTMLElement)
    }
  }

  /**
   * Task status
   */
  const refreshTaskStatus = () => {
    const projectCode = Number(route.params.projectCode)
    const instanceId = Number(route.params.id)

    queryTaskListByProcessId(instanceId, projectCode).then((res: any) => {
      window.$message.success(t('project.workflow.refresh_status_succeeded'))
      taskList.value = res.taskList
      if (taskList.value) {
        taskList.value.forEach((taskInstance: any) => {
          setNodeStatus(taskInstance.taskCode, taskInstance.state, taskInstance)
        })
      }
    })
  }

  return {
    taskList,
    refreshTaskStatus
  }
}
