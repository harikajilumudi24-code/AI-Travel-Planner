import { Link } from 'react-router-dom';
import { Compass, Github, Twitter, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 mt-auto">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-extrabold">VoyageAI</span>
            </Link>
            <p className="text-sm text-gray-500 max-w-md">
              Plan personalized trips with AI, discover real places and restaurants, check live weather,
              and explore interactive maps — all powered by real-time data.
            </p>
            <div className="flex gap-3 mt-4">
              {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/explore" className="hover:text-primary-600 transition">Places</Link></li>
              <li><Link to="/restaurants" className="hover:text-primary-600 transition">Restaurants</Link></li>
              <li><Link to="/weather" className="hover:text-primary-600 transition">Weather</Link></li>
              <li><Link to="/assistant" className="hover:text-primary-600 transition">AI Assistant</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/plan" className="hover:text-primary-600 transition">Plan a Trip</Link></li>
              <li><Link to="/trips" className="hover:text-primary-600 transition">My Trips</Link></li>
              <li><Link to="/profile" className="hover:text-primary-600 transition">Profile</Link></li>
              <li><Link to="/register" className="hover:text-primary-600 transition">Sign up</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between gap-3 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} VoyageAI. All travel data sourced from Geoapify, OpenWeather, and Tavily.</p>
          <p>Built with React, FastAPI, MySQL, and Groq Llama 3.3.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
