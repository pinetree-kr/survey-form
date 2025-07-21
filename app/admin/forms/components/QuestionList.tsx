"use client"

import React, { useCallback } from "react";
import { TQuestion } from "@/app/components";
import { QuestionPanel } from "./QuestionPanel";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useFormQuestions, useFormActions } from "./FormEditorContext";

export const QuestionList = React.memo(function QuestionList() {
    const questions = useFormQuestions();
    const { updateQuestions } = useFormActions();

    // DnD 센서 훅은 최상단에서 한 번만 호출
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    // 드래그 앤 드롭 핸들러
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = Number(active.id);
            const newIndex = Number(over?.id);
            
            const newQuestions = arrayMove(questions, oldIndex, newIndex);
            updateQuestions(newQuestions);
        }
    }, [questions, updateQuestions]);

    if (questions.length === 0) {
        return (
            <div className="bg-white p-8 rounded-md shadow-md text-center">
                <p className="text-gray-500">좌측에서 문항을 추가해주세요.</p>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={questions.map((_, index) => index)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-6">
                    {questions.map((question, index: number) => (
                        <QuestionPanel
                            key={`p${question.id}`}
                            question={question}
                            questionIndex={index}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}); 