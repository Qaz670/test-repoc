import { DisplayValueHeader, Color } from 'pixel_combats/basic';
import { Game, Players, Inventory, LeaderBoard, BuildBlocksSet, Teams, Damage, BreackGraph, Ui, Properties, GameMode, Spawns, Timers, TeamsBalancer, Build, AreaService, AreaPlayerTriggerService, AreaViewService } from 'pixel_combats/room';

const weaponcolor = new Color(0, 1, 1, 0);
const skincolor = new Color(0, 5, 0, 0);
const block = new Color(128, 128, 0, 0);
const fly = new Color(0, 0, 2, 0);
const hpcolor = new Color(9, 0, 0, 0);
const statcolor = new Color(1, 1, 1, 1);

Damage.GetContext().DamageOut.Value = true;
Damage.GetContext().FriendlyFire.Value = true;
BreackGraph.OnlyPlayerBlocksDmg = true;

Teams.Add("Blue", "<b>Игроки</b>", new Color(1, 1, 1, 1));
Teams.Add("Red", "<b>Админы</b>", new Color(0, 0, 0, 0));
var admsTeam = Teams.Get("Red");
var playersTeam = Teams.Get("Blue");
Teams.Get("Blue").Spawns.SpawnPointsGroups.Add(1);
Teams.Get("Red").Spawns.SpawnPointsGroups.Add(2);
playersTeam.Build.BlocksSet.Value = BuildBlocksSet.Blue;
admsTeam.Build.BlocksSet.Value = BuildBlocksSet.AllClear;

let currentTime = new Date().toLocaleString("en-US", {timeZone: "Europe/Moscow"});

Teams.Get("Blue").Properties.Get("Deaths").Value = "<b><i><color=red>Покупки</color> от FVVF!!!</i></b>";
Teams.Get("Red").Properties.Get("Deaths").Value = "<i><b><color=cyan>Сервер создан : </a></b></i>" + currentTime;
LeaderBoard.PlayerLeaderBoardValues = [
  new DisplayValueHeader("Kills", "<b>Киллы</b>", "<b>Киллы</b>"),
  new DisplayValueHeader("Deaths", "<b>Смерти</b>", "<b>Смерти</b>"),
  new DisplayValueHeader("Scores", "<b>Очки</b>", "<b>Очки</b>"),
  new DisplayValueHeader("Status", "<b>Статус</b>", "<b>Статус</b>")
];

LeaderBoard.PlayersWeightGetter.Set(function(player) {
  return player.Properties.Get("Scores").Value;
});

Ui.GetContext().TeamProp1.Value = { Team: "Blue", Prop: "Deaths" };
Ui.GetContext().TeamProp2.Value = { Team: "Red", Prop: "Deaths" };

Teams.OnRequestJoinTeam.Add(function(player, team){
  if (GameMode.Parameters.GetBool('hello')) { 
    player.Ui.Hint.Value = `Привет ${player.NickName} ,  (${player.Id})!`; 
  }
if (player.id == "B8144131B9F6EF9C" 
    Teams.Get("Red").Add(player);
  } else {
    Teams.Get("Blue").Add(player);
  } 
  if (GameMode.Parameters.GetBool("miniHp")) {
    player.contextedProperties.MaxHp.Value = 50;
  }
  if (GameMode.Parameters.GetBool("bigHp")) {
    player.contextedProperties.MaxHp.Value = 150;
  }
  // Для меня
  if (player.id == "B8144131B9F6EF9C") {
    getadm(player);
  }
  // Для девочки
  if (pla
if (player.id == "") {
   player.Properties.Get("Status").Value = "<i><b><color=yellow>Создатель</color></b></i>";
  }
if (player.id == "" || player.id == "" || player.id == "" || player.id == "" || player.id == "" || player.id == "") {
   if (player.id == "" || player.id == "" || player.id == "" || player.id == "" || player.id == "" || player.id == "") {
    player.Properties.Get("Status").Value = "<i><b><color=red>Админ</color></b></i>";
  }
  } else {
    player.Properties.Get("Status").Value = "<i><b><color=blue>Игрок</color></b></i>";
  }
});

Teams.OnPlayerChangeTeam.Add(function(player){ 
  player.Spawns.Spawn();
  player.PopUp("Покупки от <i><b><color=red>FVVF</color></b></i>});
var immortalityTimerName = "immortality";
Spawns.GetContext().OnSpawn.Add(function(player){
  player.Properties.Immortality.Value = true;
  timer = player.Timers.Get(immortalityTimerName).Restart(5);
});
Timers.OnPlayerTimer.Add(function(timer){
  if (timer.Id != immortalityTimerName) return;
  timer.Player.Properties.Immortality.Value = false;
});

Damage.OnDeath.Add(function(player) {
  if (GameMode.Parameters.GetBool('AutoSpawn')) {
    Spawns.GetContext(player).Spawn();
    ++player.Properties.Deaths.Value;
    return;
  }
  ++p.Properties.Deaths.Value;
});
Damage.OnDamage.Add(function(player, damaged, damage) {
  if (GameMode.Parameters.GetBool("scoresOnDamage")) {
    if (player.id != damaged.id) player.Properties.Scores.Value += Math.ceil(damage);
  }
});

Damage.OnKill.Add(function(player, killed) {
  if (player.id !== killed.id) { 
    ++player.Properties.Kills.Value;
    player.Properties.Scores.Value += 100;
  }
 if (player.Properties.Kills.Value == 1) {
    player.PopUp("<b><size=15>Выполнено Достижение!<color=lime> \n Первое убийство (Награда: 2500 монет, 1 пропуск для ящика)</color></size></b>");
    player.Properties.Scores.Value += 1000;
  }
  if (p.Properties.Kills.Value == 10) {
    p.PopUp("<b><size=15>Выполнено Достижение!<color=lime> \n Убийца, убейте 10 игроков (Награда: 10000 монет, 2 пропуска для ящика)</color></size></b>");
    p.Properties.Scores.Value += 10000;
  }
  if (p.Properties.Kills.Value == 50) {
    p.PopUp("<b><size=15>Выполнено Достижение!<color=lime> \n ТЫ МАНЬЯК?!, убейте 50 игроков (Награда: 20000 монет, Статус Маньяк, 5 пропусков для ящика)</color></size></b>");
    p.Properties.Scores.Value += 50000;
    p.Properties.Get("Статус").Value = "<b><color=red>Маньяк</color></b>";
  }
  if (p.Properties.Kills.Value == 100) {
    p.PopUp("<b><size=15>Выполнено Достижение!<color=lime> \n Киллер, убейте 100 игроков (Награда: 35000 монет, Статус Киллер, 10 пропусков для ящика)</color></size></b>");
    p.Properties.Scores.Value += 100000;
    p.Properties.Get("Статус").Value = "<b><color=red>Киллер</color></b>";
  }
  if (p.Properties.Kills.Value == 200) {
    p.PopUp("<b><size=15>Выполнено Достижение!<color=lime> \n Демон, убейте 200 игроков (Награда: 75000 монет, Статус Демон, 15 пропусков для ящика)</color></size></b>");
    p.Properties.Scores.Value += 200000;
    p.Properties.Get("Статус").Value = "<b><color=red>Демон</color></b>";
    p.contextedProperties.SkinType.Value = 2;
  }
  if (p.Properties.Kills.Value == 350) {
    p.PopUp("<b><size=15>Выполнено Достижение!<color=lime> \n Мафия, убейте 350 игроков (Награда: 125000 монет, Статус Мафиози, 25 пропусков для ящика)</color></size></b>");
    p.Properties.Scores.Value += 350000;
    p.Properties.Get("Статус").Value = "<b><color=red>Мафиози</color></b>";
  }
  if (p.Properties.Kills.Value == 750) {
    p.PopUp("<b><size=15>Выполнено Достижение!<color=lime> \n СВО, убейте 500 игроков (Награда: 250000 монет, Статус СВО, 40 пропусков для ящика)</color></size></b>");
    p.Properties.Scores.Value += 750000;
    p.Properties.Get("Статус").Value = "<b><color=red>СВО</color></b>";
    p.contextedProperties.SkinType.Value = 1;
  }
});


var inventory = Inventory.GetContext();
inventory.Main.Value = false;
inventory.Secondary.Value = false;
inventory.Melee.Value = false;
inventory.Explosive.Value = false;
inventory.Build.Value = false;
inventory.BuildInfinity.Value = false;

Spawns.GetContext().RespawnTime.Value = 5;
