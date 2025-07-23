import { SurveyDetailView } from './components'

interface SurveyDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SurveyDetailPage({ params }: SurveyDetailPageProps) {
  const { id } = await params

  return <SurveyDetailView surveyId={id} />
} 