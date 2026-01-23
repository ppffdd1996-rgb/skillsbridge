import Admin from './pages/Admin';
import Applications from './pages/Applications';
import CandidateDashboard from './pages/CandidateDashboard';
import CareerMatch from './pages/CareerMatch';
import Companies from './pages/Companies';
import CreateOpportunity from './pages/CreateOpportunity';
import Discover from './pages/Discover';
import EditProfile from './pages/EditProfile';
import Home from './pages/Home';
import Matches from './pages/Matches';
import MyJobs from './pages/MyJobs';
import Opportunities from './pages/Opportunities';
import PostJob from './pages/PostJob';
import Profile from './pages/Profile';
import RecruiterAnalytics from './pages/RecruiterAnalytics';
import SkillPassport from './pages/SkillPassport';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Applications": Applications,
    "CandidateDashboard": CandidateDashboard,
    "CareerMatch": CareerMatch,
    "Companies": Companies,
    "CreateOpportunity": CreateOpportunity,
    "Discover": Discover,
    "EditProfile": EditProfile,
    "Home": Home,
    "Matches": Matches,
    "MyJobs": MyJobs,
    "Opportunities": Opportunities,
    "PostJob": PostJob,
    "Profile": Profile,
    "RecruiterAnalytics": RecruiterAnalytics,
    "SkillPassport": SkillPassport,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};