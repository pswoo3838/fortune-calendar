import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] 오류 발생:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={styles.container}>
          <div style={styles.icon}>⚠️</div>
          <h2 style={styles.title}>문제가 발생했어요</h2>
          <p style={styles.message}>
            일시적인 오류가 발생했습니다.
            <br />
            아래 버튼을 눌러 다시 시도해주세요.
          </p>
          <button type="button" onClick={this.handleRetry} style={styles.button}>
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "40px 20px",
    backgroundColor: "#FAFAFA",
    textAlign: "center" as const,
  },
  icon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  title: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#1B1D1F",
    margin: "0 0 8px 0",
  },
  message: {
    fontSize: "14px",
    color: "#6B7684",
    lineHeight: "1.5",
    margin: "0 0 24px 0",
  },
  button: {
    padding: "14px 32px",
    fontSize: "15px",
    fontWeight: 600,
    backgroundColor: "#6B4EFF",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
  },
};
