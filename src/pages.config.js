/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Admin from './pages/Admin';
import Applications from './pages/Applications';
import CandidateDashboard from './pages/CandidateDashboard';
import CareerMatch from './pages/CareerMatch';
import CareerPathway from './pages/CareerPathway';
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
import RecruiterAI from './pages/RecruiterAI';
import RecruiterAnalytics from './pages/RecruiterAnalytics';
import SkillPassport from './pages/SkillPassport';
import TalentPoolDashboard from './pages/TalentPoolDashboard';
import HowItWorks from './pages/HowItWorks';
import Support from './pages/Support';
import AdminSupport from './pages/AdminSupport';
import Privacy from './pages/Privacy';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Applications": Applications,
    "CandidateDashboard": CandidateDashboard,
    "CareerMatch": CareerMatch,
    "CareerPathway": CareerPathway,
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
    "RecruiterAI": RecruiterAI,
    "RecruiterAnalytics": RecruiterAnalytics,
    "SkillPassport": SkillPassport,
    "TalentPoolDashboard": TalentPoolDashboard,
    "HowItWorks": HowItWorks,
    "Support": Support,
    "AdminSupport": AdminSupport,
    "Privacy": Privacy,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};