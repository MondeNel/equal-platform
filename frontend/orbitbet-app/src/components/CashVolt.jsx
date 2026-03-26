const STREAK_STEPS = [3, 6, 9, 12, 15, 18];

export const CashVoltLadder = ({ currentStreak }) => {
    return (
        <div className="flex flex-col-reverse gap-2 p-4 bg-gray-900 rounded-lg">
            {STREAK_STEPS.map((step) => (
                <div 
                    key={step}
                    className={`p-2 text-center rounded transition-all duration-500 ${
                        currentStreak >= step 
                        ? "bg-yellow-400 text-black font-bold shadow-[0_0_15px_rgba(250,204,21,0.6)]" 
                        : "bg-gray-800 text-gray-500"
                    }`}
                >
                    {step}x BONUS
                </div>
            ))}
            <div className="text-xs text-center text-gray-400 uppercase mb-2">
                Win Streak: {currentStreak}
            </div>
        </div>
    );
};