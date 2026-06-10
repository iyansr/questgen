import type { UIMessage } from 'ai';

export type SessionStatus = 'pending' | 'generating' | 'completed' | 'failed';

export type QuestionType =
	| 'multiple_choice'
	| 'true_false'
	| 'short_answer'
	| 'essay';

export type QuestionOption = {
	label: string;
	text: string;
};

export type StreamedQuestion = {
	id: string;
	questionText: string;
	questionType: QuestionType;
	imageUrl: string | null;
	options: QuestionOption[] | null;
	correctAnswer: string;
	suggestedAnswer: string;
	order: number;
};

export type SessionMessage = UIMessage<
	never,
	{
		status: {
			status: SessionStatus;
			errorMessage: string | null;
		};
		question: StreamedQuestion;
	}
>;
