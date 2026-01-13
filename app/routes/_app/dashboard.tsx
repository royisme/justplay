import { Plus, BookOpen } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/Card";

// Mock data for initial implementation
const activeGames = [
  { id: "123", title: "黑暗森林", chapter: "V2-C3", status: "active", lastPlayed: "2 hours ago" },
  { id: "456", title: "星际迷航", chapter: "开始", status: "active", lastPlayed: "1 day ago" },
];

const completedGames = [
  { id: "789", title: "龙之谷", endedAt: "2025-01-15", ending: "Heroic Victory" },
  { id: "000", title: "废土日记", endedAt: "2024-12-20", ending: "Bad Ending" },
];

export default function Dashboard() {
  const slotsUsed = activeGames.length;
  const maxSlots = 3;

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">我的冒险</h1>
          <p className="text-muted-foreground">管理你的活跃游戏和存档 (槽位: {slotsUsed}/{maxSlots})</p>
        </div>
        {slotsUsed < maxSlots && (
          <Button asChild>
            <Link to="/game/new">
              <Plus className="mr-2 h-4 w-4" /> 新游戏
            </Link>
          </Button>
        )}
      </div>

      {/* Active Games Slots */}
      <div className="grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((slotIndex) => {
          const game = activeGames[slotIndex];

          if (game) {
             return (
              <Card key={game.id} className="flex flex-col border-indigo-200 dark:border-indigo-900 bg-white dark:bg-zinc-950">
                <CardHeader>
                  <CardTitle>{game.title}</CardTitle>
                  <CardDescription>当前进度: {game.chapter}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="aspect-video w-full rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                    Game Preview
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">上次游玩: {game.lastPlayed}</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link to={`/game/${game.id}`}>继续冒险</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          } else {
            return (
              <Card key={`empty-${slotIndex}`} className="flex flex-col border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent shadow-none">
                <CardContent className="flex flex-1 flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <Plus className="h-6 w-6 text-zinc-400" />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold">空槽位</h3>
                  <p className="mb-4 text-sm">开始一段新的旅程</p>
                  <Button variant="outline" asChild disabled={slotsUsed >= maxSlots}>
                    <Link to="/game/new">创建游戏</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          }
        })}
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
             <h2 className="text-2xl font-bold tracking-tight">藏书阁</h2>
             <Button variant="ghost" asChild>
                <Link to="/library">查看全部 <BookOpen className="ml-2 h-4 w-4" /></Link>
             </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
            {completedGames.map(game => (
                <Card key={game.id} className="group cursor-pointer transition-all hover:border-indigo-500 hover:shadow-md">
                    <CardContent className="p-4">
                        <div className="aspect-[2/3] w-full rounded bg-zinc-800 mb-3 flex items-center justify-center text-white">
                            Book Cover
                        </div>
                        <h3 className="font-semibold group-hover:text-indigo-600">{game.title}</h3>
                        <p className="text-xs text-muted-foreground">{game.ending}</p>
                        <p className="text-xs text-zinc-400 mt-1">{game.endedAt}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
