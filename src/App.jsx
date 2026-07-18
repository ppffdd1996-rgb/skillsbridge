import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ReferralsPage from './pages/Referrals';
import ScorecardsPage from './pages/Scorecards';
import ReferralProgramPage from './pages/ReferralProgram';
import CandidateRankingsPage from './pages/CandidateRankings';
import OfferManagementPage from './pages/OfferManagement';
import InterviewFeedbackPage from './pages/InterviewFeedback';
import CandidateOnboardingPage from './pages/CandidateOnboarding';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/Referrals" element={
        <LayoutWrapper currentPageName="Referrals">
          <ReferralsPage />
        </LayoutWrapper>
      } />
      <Route path="/Scorecards" element={
        <LayoutWrapper currentPageName="Scorecards">
          <ScorecardsPage />
        </LayoutWrapper>
      } />
      <Route path="/ReferralProgram" element={
        <LayoutWrapper currentPageName="ReferralProgram">
          <ReferralProgramPage />
        </LayoutWrapper>
      } />
      <Route path="/CandidateRankings" element={
        <LayoutWrapper currentPageName="CandidateRankings">
          <CandidateRankingsPage />
        </LayoutWrapper>
      } />
      <Route path="/OfferManagement" element={
        <LayoutWrapper currentPageName="OfferManagement">
          <OfferManagementPage />
        </LayoutWrapper>
      } />
      <Route path="/InterviewFeedback" element={
        <LayoutWrapper currentPageName="InterviewFeedback">
          <InterviewFeedbackPage />
        </LayoutWrapper>
      } />
      <Route path="/CandidateOnboarding" element={
        <LayoutWrapper currentPageName="CandidateOnboarding">
          <CandidateOnboardingPage />
        </LayoutWrapper>
      } />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App