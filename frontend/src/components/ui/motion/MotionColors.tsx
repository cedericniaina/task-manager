import { motion, easeOut } from "motion/react";

export default function MotionColor() {
  const backStyle =
    "absolute z-0 h-100 w-100 rounded-full mix-blend-darken blur-[80px] ";

  return (
    <>
      <motion.div
        initial={{ translateX: -800, translateY: -800 }}
        animate={{ translateX: 0, translateY: 0 }}
        exit={{ translateX: 800 }}
        transition={{ ease: easeOut, duration: 0.75 }}
        className={`${backStyle} -left-32 -top-32 translate-y-30 scale-100 bg-warning`}
      ></motion.div>
      <motion.div
        initial={{ translateY: 800, translateX: -800 }}
        animate={{ translateY: 0, translateX: 0 }}
        exit={{ translateX: 800 }}
        transition={{ ease: easeOut, duration: 0.85 }}
        className={`${backStyle} -bottom-40 left-1/4 -translate-y-15 translate-50 scale-140 bg-info`}
      ></motion.div>
      <motion.div
        initial={{ translateY: 800, translateX: 800 }}
        animate={{ translateY: 0, translateX: 0 }}
        exit={{ translateX: 800 }}
        transition={{ ease: easeOut, duration: 1 }}
        className={`${backStyle} -right-40 top-1/4 -translate-25 scale-100 bg-error`}
      ></motion.div>
      <motion.div
        initial={{ translateY: -1000, translateX: 0 }}
        animate={{ translateY: 0, translateX: 0 }}
        exit={{ translateX: 800 }}
        transition={{ ease: easeOut, duration: 1 }}
        className={`${backStyle} -bottom-40 right-1/4 translate-x-40 translate-y-20 scale-90 bg-success`}
      ></motion.div>
    </>
  );
}
