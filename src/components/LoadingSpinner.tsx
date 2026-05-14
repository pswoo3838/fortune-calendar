import type { CSSProperties } from "react";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "운세를 생성하고 있어요..." }: LoadingSpinnerProps) {
  return (
    <div style={styles.container}>
      <div style={styles.spinner} />
      <p style={styles.message}>{message}</p>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid #E5E8EB",
    borderTop: "3px solid #6B4EFF",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginBottom: "16px",
  },
  message: {
    fontSize: "14px",
    color: "#6B7684",
    margin: 0,
  },
};
