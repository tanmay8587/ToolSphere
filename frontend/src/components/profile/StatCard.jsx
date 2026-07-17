import { motion } from "framer-motion";

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const countVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.1 + 0.2,
      duration: 0.3,
      ease: "easeOut",
    },
  }),
};

export default function StatCard({
  icon,
  label,
  count,
  color,
  hoverColor,
  index = 0,
  onClick,
}) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 25 },
      }}
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-opacity-60 ${hoverColor}`}
    >
      {/* Animated background glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
        style={{ backgroundColor: color.replace("/15", "/30") }}
      />

      {/* Icon */}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>

      {/* Count with animation */}
      <motion.p
        custom={index}
        variants={countVariants}
        initial="hidden"
        animate="visible"
        className="mt-4 text-3xl font-bold text-white"
      >
        {count}
      </motion.p>

      {/* Label */}
      <p className="mt-1 text-sm text-slate-400">{label}</p>

      {/* Hover indicator */}
      <div
        className="absolute bottom-0 left-0 h-1 w-0 transition-all duration-300 group-hover:w-full"
        style={{ backgroundColor: color.replace("/15", "") }}
      />
    </motion.div>
  );
}