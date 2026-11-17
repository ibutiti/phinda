import {
  buildQuestionBankWorkflow,
  type ApprovedSource,
  type QuestionGeneratorInput,
  type QuestionBankDatabase,
  type AIQuestionRunner,
} from '../lib/caps-question-bank'

export { buildQuestionBankWorkflow }
export type {
  ApprovedSource,
  QuestionGeneratorInput,
  QuestionBankDatabase,
  AIQuestionRunner,
}

export async function createQuestionBankHandler(params: {
  approvedSources?: ApprovedSource[]
  db?: QuestionBankDatabase
  ai?: AIQuestionRunner
} = {}) {
  const workflow = await buildQuestionBankWorkflow(params)

  return async function handleQuestionBankRequest(request: Request): Promise<Response> {
    const payload = (await request.json()) as Partial<QuestionGeneratorInput>

    const result = await workflow.approve({
      id: payload.id,
      prompt: payload.prompt ?? '',
      type: payload.type ?? 'multiple-choice',
      sourceRef: payload.sourceRef ?? '',
      sourceTitle: payload.sourceTitle,
      options: payload.options,
      answerKey: payload.answerKey,
      explanation: payload.explanation,
      rubric: payload.rubric,
      generatedFrom: payload.generatedFrom,
      approvedSources: params.approvedSources,
    })

    if (result.status === 'rejected') {
      return Response.json(
        {
          ok: false,
          question: result,
        },
        { status: 400 },
      )
    }

    if (params.db) {
      await workflow.persist(result)
    }

    return Response.json({
      ok: true,
      question: workflow.studentView(result),
    })
  }
}
