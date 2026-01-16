import Home from './pages/Home';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import PostJob from './pages/PostJob';
import MyJobs from './pages/MyJobs';
import Companies from './pages/Companies';
import Opportunities from './pages/Opportunities';
import SkillPassport from './pages/SkillPassport';
import Matches from './pages/Matches';
import CreateOpportunity from './pages/CreateOpportunity';
import Admin from './pages/Admin';
import Discover from './pages/Discover';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Profile": Profile,
    "EditProfile": EditProfile,
    "PostJob": PostJob,
    "MyJobs": MyJobs,
    "Companies": Companies,
    "Opportunities": Opportunities,
    "SkillPassport": SkillPassport,
    "Matches": Matches,
    "CreateOpportunity": CreateOpportunity,
    "Admin": Admin,
    "Discover": Discover,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};