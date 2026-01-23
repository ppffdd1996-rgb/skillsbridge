import Admin from './pages/Admin';
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
import SkillPassport from './pages/SkillPassport';
import Applications from './pages/Applications';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterAnalytics from './pages/RecruiterAnalytics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
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
    "SkillPassport": SkillPassport,
    "Applications": Applications,
    "CandidateDashboard": CandidateDashboard,
    "RecruiterAnalytics": RecruiterAnalytics,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};