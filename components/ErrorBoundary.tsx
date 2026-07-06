"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex min-h-screen items-center justify-center bg-gf-paper px-6 font-sans">
        <div className="text-center">
          <div className="font-serifcn text-[40px] text-gf-green">简配</div>
          <p className="mt-4 text-[15px] text-gf-soft">出了点问题，刷新页面试试。</p>
          <pre className="mx-auto mt-4 max-w-md overflow-auto rounded-md bg-gf-surface/60 p-3 text-left text-[11px] leading-relaxed text-gf-faint">
            {this.state.error?.message ?? "未知错误"}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-5 rounded-lg border border-gf-rule px-4 py-2 text-[14px] text-gf-soft transition-colors hover:bg-gf-greentint"
          >
            再试一次
          </button>
        </div>
      </div>
    );
  }
}
