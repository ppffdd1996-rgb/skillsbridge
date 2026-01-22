import Admin from './pages/Admin';
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
import CareerMatch from './pages/CareerMatch';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
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
    "CareerMatch": CareerMatch,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};