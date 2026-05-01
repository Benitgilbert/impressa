import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

/**
 * AdminLayout provides a shared Sidebar and Topbar for all admin routes.
 * This prevents the sidebar from re-rendering (and jumping) during navigation.
 */
function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-cream-100 dark:bg-charcoal-900 transition-colors duration-300">
            {/* Sidebar remains mounted during navigation */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="lg:ml-64 min-h-screen flex flex-col transition-all duration-300">
                {/* Topbar remains mounted during navigation */}
                <Topbar onMenuClick={() => setSidebarOpen(true)} />

                {/* Only this part changes when you navigate */}
                <main className="flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
