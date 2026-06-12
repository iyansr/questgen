import { useCallback, useState } from 'react';

import type { QuestionPatch } from '@/services/sessions/update-questions';

type StagedImage = {
	file: File;
	previewUrl: string;
};

export type StagedEdit = {
	patch: QuestionPatch;
	image: StagedImage | null;
	removeImage: boolean;
};

export type EditsState = Record<string, StagedEdit>;

export function useQuestionEdits() {
	const [edits, setEdits] = useState<EditsState>({});

	const setEdit = useCallback(
		(
			questionId: string,
			patch: QuestionPatch,
			imageFile: File | null,
			removeImage: boolean,
		) => {
			setEdits((prev) => {
				const next = { ...prev };
				if (imageFile) {
					const previewUrl = URL.createObjectURL(imageFile);
					const previous = prev[questionId];
					if (previous?.image?.previewUrl) {
						URL.revokeObjectURL(previous.image.previewUrl);
					}
					next[questionId] = {
						patch,
						image: { file: imageFile, previewUrl },
						removeImage: false,
					};
				} else if (removeImage) {
					const previous = prev[questionId];
					if (previous?.image?.previewUrl) {
						URL.revokeObjectURL(previous.image.previewUrl);
					}
					next[questionId] = { patch, image: null, removeImage: true };
				} else {
					const previous = prev[questionId];
					if (previous?.image?.previewUrl) {
						URL.revokeObjectURL(previous.image.previewUrl);
					}
					next[questionId] = {
						patch: { ...patch, removeImage: undefined },
						image: null,
						removeImage: false,
					};
				}
				return next;
			});
		},
		[],
	);

	const clearAll = useCallback(() => {
		setEdits((prev) => {
			for (const edit of Object.values(prev)) {
				if (edit.image?.previewUrl) {
					URL.revokeObjectURL(edit.image.previewUrl);
				}
			}
			return {};
		});
	}, []);

	const removeEdit = useCallback((questionId: string) => {
		setEdits((prev) => {
			const edit = prev[questionId];
			if (edit?.image?.previewUrl) {
				URL.revokeObjectURL(edit.image.previewUrl);
			}
			const next = { ...prev };
			delete next[questionId];
			return next;
		});
	}, []);

	const dirtyCount = Object.keys(edits).length;

	return { edits, setEdit, clearAll, removeEdit, dirtyCount };
}

export type BuildBatchInput = {
	edits: EditsState;
};

export type BatchUpdate = {
	patches: QuestionPatch[];
	images: Array<{ questionId: string; file: File }>;
};

export function buildBatchUpdate({ edits }: BuildBatchInput): BatchUpdate {
	const patches: QuestionPatch[] = [];
	const images: Array<{ questionId: string; file: File }> = [];

	for (const [questionId, edit] of Object.entries(edits)) {
		patches.push(edit.patch);
		if (edit.image?.file) {
			images.push({ questionId, file: edit.image.file });
		}
	}

	return { patches, images };
}
