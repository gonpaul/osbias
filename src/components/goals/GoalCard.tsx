'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type GoalStatus = 'planned' | 'active' | 'blocked' | 'done' | 'dropped'

type Action = {
    id: number
    goal_id?: number
    name?: string | null
    description: string
    completed: boolean
    due_date: string | null
    created_at: string
}

export interface GoalCardProps {
    id: number
    created_at: string
    user_id: number
    title: string
    description: string | null
    status: GoalStatus
    target_date: string | null
}

export default function GoalCard(props: {
    goal: GoalCardProps
    onDelete?: () => void
    onUpdate?: (updates: Partial<{ title: string; description: string | null; status: GoalStatus; target_date: string | null }>) => void
}) {
    const { goal, onDelete, onUpdate } = props
    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState(goal.title)
    const [description, setDescription] = useState(goal.description ?? '')
    const [status, setStatus] = useState<GoalStatus>(goal.status)
    const [targetDate, setTargetDate] = useState(goal.target_date ?? '')
    const [actions, setActions] = useState<Action[]>([])
    const [expanded, setExpanded] = useState(false)
    const [newActionDescription, setNewActionDescription] = useState('')
    const [editingAction, setEditingAction] = useState<Action | null>(null)


    async function fetchActions(): Promise<void> {
        try {
            const res = await fetch(`/api/goals/${goal.id}/actions`, {
                cache: 'no-store',
                credentials: 'include',
            })
            if (!res.ok) return
            const data = await res.json()
            setActions(data as typeof actions)
        } catch {
            // ignore
        }
    }

    async function addAction(name: string): Promise<void> {
        try {
            const res = await fetch(`/api/goals/${goal.id}/actions`, {
                method: 'POST',
                cache: 'no-store',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name }),
            })
            if (!res.ok) return
            const created = await res.json()
            setActions([created, ...actions])
        } catch {
            // ignore
        }
    }

    async function deleteActionById(actionId: number): Promise<void> {
        try {
            const res = await fetch(`/api/goals/${goal.id}/actions?action_id=${actionId}`, {
                method: 'DELETE',
                cache: 'no-store',
                credentials: 'include',
            })
            if (res.ok) {
                setActions(actions.filter((a) => a.id !== actionId))
            }
        } catch {
            // ignore
        }
    }

    async function updateActionById(actionId: number, updates: Partial<Action>): Promise<void> {
        try {
            const res = await fetch(`/api/goals/${goal.id}/actions?action_id=${actionId}`, {
                method: 'PUT',
                cache: 'no-store',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            })
            if (!res.ok) return
            const updated = await res.json()
            setActions(actions.map((a) => (a.id === actionId ? updated : a)))
        } catch {
            // ignore
        }
    }
    return (
        <div
            className="w-full rounded-lg border border-(--secondary)/40
            p-6 shadow-sm"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    {isEditing ? (
                        <input
                            className="w-full rounded-md border border-(--secondary)/40 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-0 focus:border-(--emphasis)/80"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    ) : (
                        <div className="flex items-center gap-8">
                            <h3 className="text-xl font-semibold">{goal.title}</h3>
                            {actions.length > 0 && (
                                <span className="text-xs ml-auto pt-2 text-(--emphasis-light)/80">
                                    {Math.round((actions.filter(a => a.completed).length / actions.length) * 100)}%
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!isEditing && (
                        <span className="text-xs py-1.5 px-6 bg-(--secondary)/20 rounded-3xl">
                            {goal.status}
                        </span>
                    )}
                    <button
                        type="button"
                        aria-label={isEditing ? 'Save' : 'Edit'}
                        className="rounded-md p-2 text-md text-white hover:text-blue-500 transition-colors duration-300 cursor-pointer"
                        onClick={() => {
                            if (isEditing) {
                                onUpdate?.({
                                    title: title.trim() || goal.title,
                                    description: description.trim() ? description.trim() : null,
                                    status,
                                    target_date: targetDate || null,
                                })
                            }
                            setIsEditing(!isEditing)
                        }}
                    >
                        {isEditing ? '✔' : '✎'}
                    </button>
                    <button
                        type="button"
                        aria-label="Delete"
                        className="rounded-md p-2 text-md text-white cursor-pointer transition-colors duration-300 hover:text-red-500"
                        onClick={() => onDelete?.()}
                    >
                        🗑
                    </button>
                </div>
            </div>
            <div className="mt-3">
                {isEditing ? (
                    <textarea
                        className="w-full rounded-md border border-(--secondary)/40 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-0 focus:border-(--emphasis)/80"
                        rows={3}
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                ) : goal.description ? (
                    <p className="mt-2 text-md text-(--muted)">{goal.description}</p>
                ) : null}
            </div>
            <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-(--secondary)">
                    {new Date(goal.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <select
                                className="rounded-md border border-(--secondary)/40 bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-0 focus:border-(--emphasis)/80"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as GoalStatus)}
                            >
                                <option value="planned">planned</option>
                                <option value="active">active</option>
                                <option value="blocked">blocked</option>
                                <option value="done">done</option>
                                <option value="dropped">dropped</option>
                            </select>
                            <input
                                type="date"
                                className="rounded-md border border-(--secondary)/40 bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-0 focus:border-(--emphasis)/80"
                                value={targetDate}
                                onChange={(e) => setTargetDate(e.target.value)}
                            />
                        </>
                    ) : goal.target_date ? (
                        <span className="text-xs text-(--emphasis-light)/80">→ {goal.target_date}</span>
                    ) : null}
                </div>
            </div>

            {/* Actions list */}
            <div className="mt-4 border-t-2 border-(--secondary)/60 pt-4">
                <div
                    className={`rounded-md border border-(--secondary)/40 transition-all duration-300 ease-in-out ${
                        expanded ? 'max-h-96 opacity-100 p-4' : 'max-h-0 opacity-0 p-0'
                    } overflow-x-hidden overflow-y-scroll`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">Actions</h4>
                        <button
                            type="button"
                            className="text-xs rounded-md px-4 py-2 hover:bg-(--secondary) text-white cursor-pointer transition-colors duration-300"
                            onClick={() => setExpanded(false)}
                        >
                            Collapse
                        </button>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-3 w-fit rounded-md border border-(--secondary)/40 bg-(--secondary)/20 px-2 py-2">
                            <input
                                className="rounded-md ps-4 py-2 text-sm focus:outline-none focus:ring-0 focus:border-0 placeholder:text-(--secondary)"
                                placeholder="Add a new action..."
                                value={newActionDescription}
                                onChange={(e) => setNewActionDescription(e.target.value)}
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                        const text = newActionDescription.trim()
                                        if (!text) return
                                        await addAction(text)
                                        setNewActionDescription('')
                                    }
                                }}
                                aria-label="New action description"
                            />
                            <button
                                type="button"
                                className="text-xs rounded-md px-6 py-2 bg-(--emphasis) text-white cursor-pointer disabled:opacity-50 hover:bg-(--secondary) transition-colors duration-300"
                                disabled={!newActionDescription.trim()}
                                onClick={async () => {
                                    const text = newActionDescription.trim()
                                    if (!text) return
                                    await addAction(text)
                                    setNewActionDescription('')
                                }}
                                aria-label="Add action"
                            >
                                Add
                            </button>
                        </div>
                        {actions.map((a) => {
                            const completedClasses = a.completed ? 'bg-(--emphasis) border-(--emphasis)' : 'bg-transparent border-(--secondary)/40'
                            return (
                                <div
                                    key={a.id}
                                    className="group flex items-center justify-between p-4 rounded-md border-t-1 border-(--secondary)/20 text-sm transition-colors duration-300 hover:bg-(--background)/30"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <button
                                            type="button"
                                            aria-label={a.completed ? 'Mark incomplete' : 'Mark complete'}
                                            className={`h-8 w-8 cursor-pointer hover:bg-blue-700/20 rounded-full border transition-all duration-300 ${completedClasses}`}
                                            onClick={() => updateActionById(a.id, { completed: !a.completed })}
                                        />
                                        <button
                                            type="button"
                                            className="flex-1 ml-3 cursor-pointer text-left text-md truncate"
                                            onClick={() => setEditingAction(a)}
                                            title={(a.name ?? a.description) || ''}
                                        >
                                            {a.name ?? a.description}
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label="Delete action"
                                        className="rounded-md p-1 text-xs text-white cursor-pointer transition-colors duration-300 hover:text-red-500"
                                        onClick={() => deleteActionById(a.id)}
                                    >
                                        🗑
                                    </button>
                                </div>
                            )
                        })}
                        {actions.length === 0 && (
                            <span className="text-xs mt-3 ps-2 text-(--secondary)">No actions yet</span>
                        )}
                    </div>
                </div>
                {!expanded && (
                    <div className="flex justify-center">
                        <button
                            type="button"
                            className="text-xs rounded-md px-4 py-2 hover:bg-(--secondary) transition-colors duration-300 text-white cursor-pointer"
                            onClick={async () => {
                                if (!expanded && actions.length === 0) {
                                    await fetchActions()
                                }
                                setExpanded(true)
                            }}
                        >
                            Expand
                        </button>
                    </div>
                )}
            </div>

            

            {/* Action edit modal */}
            <AnimatePresence>
                {editingAction && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                    >
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 bg-black/50"
                            onClick={() => setEditingAction(null)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.96 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="relative w-full max-w-md min-h-100 rounded-lg border border-(--secondary)/40 bg-(--darkelbg) p-20"
                        >
                            {/* Your existing modal content (title, inputs, buttons) */}
                        <h5 className="text-3xl text-center font-semibold mb-15">Edit action</h5>
                        <input
                            className="mb-4 w-full rounded-md border border-(--secondary)/40 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-0 focus:border-(--emphasis)/80"
                            value={editingAction?.name ?? ''}
                            onChange={(e) => editingAction && setEditingAction({ ...editingAction, name: e.target.value })}
                            placeholder="Action name"
                            aria-label="Action name"
                        />
                            <div className="flex flex-col gap-3">
                                <input
                                    className="rounded-md border border-(--secondary)/40 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-0 focus:border-(--emphasis)/80"
                                    value={editingAction.description}
                                    onChange={(e) => setEditingAction({ ...editingAction, description: e.target.value })}
                                    placeholder="Description"
                                />
                                <input
                                    type="date"
                                    className="rounded-md border border-(--secondary)/40 bg-transparent px-2 py-2 text-sm focus:outline-none focus:ring-0 focus:border-(--emphasis)/80"
                                    value={editingAction.due_date ?? ''}
                                    onChange={(e) => setEditingAction({ ...editingAction, due_date: e.target.value || null })}
                                />
                                <label className="flex items-center ml-2 mt-4 gap-4 text-xs">
                                    <input
                                        type="checkbox"
                                        checked={editingAction.completed}
                                        onChange={(e) => setEditingAction({ ...editingAction, completed: e.target.checked })}
                                        className="appearance-none w-5 h-5 rounded-md border border-(--secondary)/40 bg-transparent checked:bg-(--emphasis) checked:border-(--emphasis) focus:outline-none transition-all duration-200 relative
                                            after:content-[''] after:absolute after:inset-0 after:flex after:items-center after:justify-center
                                            checked:after:content-['✓'] checked:after:text-white checked:after:text-lg"
                                    />
                                    Completed
                                </label>
                            </div>
                            <div className="mt-8 flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="text-xs rounded-md px-3 py-2 hover:bg-(--secondary) text-white cursor-pointer transition-colors duration-300"
                                    onClick={() => setEditingAction(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="text-xs rounded-md px-3 py-2 bg-(--emphasis) hover:bg-(--secondary) text-white cursor-pointer transition-colors duration-300"
                                    onClick={async () => {
                                        if (!editingAction) return;
                                        const { id, name, description, completed, due_date } = editingAction
                                        await updateActionById(id, { name: name ?? null, description, completed, due_date })
                                        setEditingAction(null)
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}