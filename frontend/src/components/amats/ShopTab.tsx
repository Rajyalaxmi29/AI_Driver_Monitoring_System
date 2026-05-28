"use client";

export default function ShopTab() {
  const products = [
    {
      name: "Pro Driver Cam",
      description: "1080p IR-enabled AI driver monitoring camera with night vision.",
      price: "$149",
      badge: "Best Seller",
      badgeColor: "bg-green-500",
      emoji: "📷",
    },
    {
      name: "A.M.A.T.S. Premium",
      description: "Unlock advanced analytics, cloud sync, and detailed fatigue reports.",
      price: "$9.99/mo",
      badge: "Popular",
      badgeColor: "bg-blue-500",
      emoji: "⭐",
    },
    {
      name: "Smart Alert Speaker",
      description: "In-cabin alert speaker with haptic buzz and voice wake-up notifications.",
      price: "$59",
      badge: "New",
      badgeColor: "bg-purple-500",
      emoji: "🔊",
    },
    {
      name: "Data Export Pack",
      description: "Export all session logs and AI insights to CSV, PDF, or JSON format.",
      price: "$4.99",
      badge: null,
      badgeColor: "",
      emoji: "📊",
    },
    {
      name: "Fleet Manager Add-On",
      description: "Monitor multiple drivers simultaneously with a fleet dashboard.",
      price: "$29.99/mo",
      badge: "Enterprise",
      badgeColor: "bg-gray-700",
      emoji: "🚛",
    },
    {
      name: "Drowsiness Report",
      description: "Weekly AI-generated drowsiness and safety report emailed to you.",
      price: "$2.99/mo",
      badge: null,
      badgeColor: "",
      emoji: "📧",
    },
  ];

  return (
    <div className="mt-4">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Shop</h2>
        <p className="text-sm text-gray-500 mt-1">Enhance your monitoring experience with premium add-ons.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {products.map((p) => (
          <div
            key={p.name}
            className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="text-3xl">{p.emoji}</div>
              {p.badge && (
                <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${p.badgeColor}`}>
                  {p.badge}
                </span>
              )}
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">{p.name}</div>
              <div className="text-xs text-gray-500 mt-1 leading-relaxed">{p.description}</div>
            </div>
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
              <span className="text-base font-bold text-gray-900">{p.price}</span>
              <button className="text-xs font-semibold bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
