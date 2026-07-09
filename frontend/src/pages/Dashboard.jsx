import { useEffect, useState } from "react";
import { getDashboard } from "../../services/adminApi";
import AdminLayout from "../../layout/AdminLayout";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTools: 0,
    featuredTools: 0,
    pendingTools: 0,
    categories: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await getDashboard();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Total Tools",
      value: stats.totalTools,
      color: "bg-cyan-600",
    },
    {
      title: "Featured Tools",
      value: stats.featuredTools,
      color: "bg-green-600",
    },
    {
      title: "Pending Approval",
      value: stats.pendingTools,
      color: "bg-yellow-600",
    },
    {
      title: "Categories",
      value: stats.categories,
      color: "bg-purple-600",
    },
  ];

  return (
    <AdminLayout>
      <div>
        <h1 className="mb-8 text-3xl font-bold text-white">
          Dashboard
        </h1>

        {loading ? (
          <div className="text-slate-400">
            Loading Dashboard...
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                >
                  <div
                    className={`mb-4 h-12 w-12 rounded-xl ${card.color}`}
                  ></div>

                  <p className="text-slate-400">
                    {card.title}
                  </p>

                  <h2 className="mt-2 text-4xl font-bold text-white">
                    {card.value}
                  </h2>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-8">
              <h2 className="mb-4 text-2xl font-bold text-white">
                Welcome 👋
              </h2>

              <p className="text-slate-400">
                Welcome to the ToolSphere Admin Dashboard.
                From here you can manage AI tools,
                approve submissions, feature tools,
                edit information and monitor your website.
              </p>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}