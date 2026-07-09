import {
  FiCheckCircle,
  FiCpu,
  FiZap,
  FiGlobe,
  FiSmartphone,
  FiCode,
} from "react-icons/fi";

const icons = [
  FiCheckCircle,
  FiCpu,
  FiZap,
  FiGlobe,
  FiSmartphone,
  FiCode,
];

export default function ToolFeatures({ tool }) {
  if (!tool?.features?.length) return null;

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-xl">
      <h2 className="mb-8 text-2xl font-bold text-white">
        Features
      </h2>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tool.features.map((feature, index) => {
          const Icon = icons[index % icons.length];

          return (
            <div
              key={index}
              className="group rounded-3xl border border-white/10 bg-slate-950/70 p-6 transition duration-300 hover:border-cyan-500 hover:-translate-y-1"
            >
              <Icon className="mb-4 text-3xl text-cyan-400" />

              <h3 className="text-lg font-semibold text-white">
                {feature}
              </h3>
            </div>
          );
        })}
      </div>
    </section>
  );
}