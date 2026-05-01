import { useState } from "react";
import { Outlet } from "react-router-dom";
import SellerSidebar from "./SellerSidebar";
import Topbar from "./Topbar";
import AdminChatBot from "./AdminChatBot";

function SellerLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
            <SellerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <Topbar onMenuClick={() => setSidebarOpen(true)} />
                
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
            
            <AdminChatBot storageKey="sellerChatMessages" title="Seller Assistant" />
        </div>
    );
}

export default SellerLayout;
