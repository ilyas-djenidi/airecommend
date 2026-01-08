export function LandingPage() {
    return (
        <div className="max-w-6xl mx-auto py-12 lg:py-24">
            <div className="flex flex-col items-center text-center mb-24">
                <h1 className="text-4xl lg:text-5xl font-black text-[var(--foreground)] mb-6 tracking-tight">
                    Welcome to <span className="text-[var(--primary)]">EcoRecycle.</span>
                </h1>
                <p className="text-lg text-[var(--muted-foreground)] max-w-xl font-medium leading-relaxed">
                    Select a section from the sidebar to manage your urban intelligence grid or monitor real-time AI simulations.
                </p>
            </div>
        </div>
    );
}
