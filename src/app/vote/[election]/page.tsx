import EvotingFeature from '@/features/evoting/evoting-feature'

interface PageProps {
  params: Promise<{ election: string }>
}

export default async function VotePage({ params }: PageProps) {
  const { election } = await params

  // Decode the election name from URL
  const electionName = decodeURIComponent(election)

  return <EvotingFeature electionName={electionName} />
}

export async function generateMetadata({ params }: PageProps) {
  const { election } = await params
  const electionName = decodeURIComponent(election)
  return {
    title: `Vote - ${electionName}`,
    description: `Cast your vote in the ${electionName} election`,
  }
}
