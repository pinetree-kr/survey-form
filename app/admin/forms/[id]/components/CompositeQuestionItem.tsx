"use client"

interface CompositeItem {
    label: string
    input_type: 'text' | 'number' | 'date' | 'email'
    unit?: string
}

interface CompositeQuestionItemProps {
    item: CompositeItem
    itemIndex: number
    questionId: string
    questionType: 'composite_single' | 'composite_multiple'
}

export default function CompositeQuestionItem({
    item,
    itemIndex,
    questionId,
    questionType
}: CompositeQuestionItemProps) {
    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // input이나 label 클릭 시 이벤트 전파 방지
        if ((e.target as HTMLElement).tagName === 'INPUT' ||
            (e.target as HTMLElement).tagName === 'LABEL') {
            return;
        }

        // 라디오/체크박스 체크
        const radioCheckbox = e.currentTarget.querySelector('input[type="radio"], input[type="checkbox"]') as HTMLInputElement;
        if (radioCheckbox) {
            radioCheckbox.checked = true;
        }

        // text input에 focus
        const textInput = e.currentTarget.querySelector('input[type="text"], input[type="number"], input[type="date"], input[type="email"]') as HTMLInputElement;
        if (textInput) {
            textInput.focus();
        }
    };

    return (
        <div
            className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={handleContainerClick}
        >
            <div className="flex items-center gap-3 mb-3">
                {questionType === 'composite_single' ? (
                    <input
                        type="radio"
                        name={`composite-${questionId}`}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                ) : (
                    <input
                        type="checkbox"
                        name={`composite-${questionId}`}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                )}
                <span className="font-medium text-gray-700">{item.label}</span>
            </div>
            <div className="ml-7 space-y-2">
                {item.input_type === 'text' && (
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="입력하세요"
                            className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {item.unit && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <div className="border-l border-gray-300 h-4 mx-2"></div>
                                <span className="text-sm text-gray-500">{item.unit}</span>
                            </div>
                        )}
                    </div>
                )}
                {item.input_type === 'number' && (
                    <div className="relative">
                        <input
                            type="number"
                            placeholder="숫자를 입력하세요"
                            className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {item.unit && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <div className="border-l border-gray-300 h-4 mx-2"></div>
                                <span className="text-sm text-gray-500">{item.unit}</span>
                            </div>
                        )}
                    </div>
                )}
                {item.input_type === 'date' && (
                    <div className="relative">
                        <input
                            type="date"
                            placeholder="날짜를 선택하세요"
                            className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                )}
                {item.input_type === 'email' && (
                    <div className="relative">
                        <input
                            type="email"
                            placeholder="이메일을 입력하세요"
                            className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                )}
            </div>
        </div>
    );
} 