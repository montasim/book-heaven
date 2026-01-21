import ContentSection from '../components/content-section'
import AccountForm from './account-form'
import { SocialAccountsSection } from '@/components/settings/social-accounts-section'

export const dynamic = 'force-dynamic'

export default function SettingsAccount() {
  return (
    <div className="space-y-6">
      <ContentSection
        title='Account'
        desc='Update your account settings. Set your preferred language and timezone.'
      >
        <AccountForm />
      </ContentSection>

      <SocialAccountsSection />
    </div>
  )
}
