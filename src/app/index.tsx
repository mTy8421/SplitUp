import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Share,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import * as Clipboard from "expo-clipboard";
import {
  balances,
  demoTrip,
  money,
  simplify,
  validateTrips,
  type Expense,
  type Trip,
} from "@/lib/engine";
import {
  Button,
  Card,
  Chips,
  colors,
  Field,
  s,
  Sheet,
  Icon,
  fonts,
  type IconName,
} from "@/components/split-ui";
import { categories, ExpenseForm, TripForm } from "@/components/split-forms";

import {
  AppShell,
  Overview,
  PageHeader,
  Grid,
  type AppTab,
} from "@/components/split-dashboard";

const KEY = "harnkan-trips-v1";
type Tab = AppTab;
type Dialog =
  | { kind: "trip" }
  | { kind: "expense"; expense?: Expense }
  | { kind: "detail"; expense: Expense }
  | { kind: "share" }
  | { kind: "data" }
  | { kind: "confirm"; text: string; action: () => void };
export default function Home() {
  const { width } = useWindowDimensions();
  const compact = width < 600;
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selected, setSelected] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<Tab>("home");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [memberName, setMemberName] = useState("");
  const [editMember, setEditMember] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const current = useRef<Trip[]>([]);
  const writing = useRef(false);
  const load = async () => {
    setLoaded(false);
    setLoadError("");
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const stored: unknown = raw === null ? [] : JSON.parse(raw);
      validateTrips(stored);
      // Remove only the untouched starter trip; preserve any user edits.
      const starter = JSON.stringify(demoTrip());
      const next = stored.filter((trip) => JSON.stringify(trip) !== starter);
      if (next.length !== stored.length) {
        await AsyncStorage.setItem(KEY, JSON.stringify(next));
      }
      current.current = next;
      setTrips(next);
      setSelected(next[0]?.id || "");
      setLoaded(true);
      setStatus("บันทึกในอุปกรณ์นี้");
    } catch {
      setLoadError(
        "อ่านข้อมูลที่บันทึกไว้ไม่ได้ ข้อมูลเดิมยังไม่ถูกเขียนทับ กรุณาลองใหม่",
      );
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const commit = async (next: Trip[]) => {
    if (writing.current) return false;
    writing.current = true;
    setBusy(true);
    setError("");
    try {
      validateTrips(next);
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
      current.current = next;
      setTrips(next);
      setStatus("บันทึกในอุปกรณ์แล้ว");
      return true;
    } catch (e) {
      setError("บันทึกไม่สำเร็จ: " + (e as Error).message);
      return false;
    } finally {
      writing.current = false;
      setBusy(false);
    }
  };
  const update = async (next: Trip) =>
    commit(current.current.map((t) => (t.id === next.id ? next : t)));
  const trip = trips.find((t) => t.id === selected) || trips[0];
  const close = () => {
    if (!writing.current) setDialog(null);
  };
  const confirm = (text: string, action: () => void) =>
    setDialog({ kind: "confirm", text, action });
  const total = trip?.expenses.reduce((n, e) => n + e.amount, 0) || 0;
  const people = trip ? balances(trip) : [];
  const transfers = trip ? simplify(trip) : [];
  const member = (id: string) =>
    trip?.members.find((m) => m.id === id)?.name || "?";
  const shareText = trip
    ? [
        "สรุปค่าใช้จ่าย · " + trip.name,
        "ยอดรวม ฿" + money(total),
        "",
        ...people.map(
          (p) =>
            p.name +
            ": จ่าย ฿" +
            money(p.paid) +
            " / ใช้จริง ฿" +
            money(p.owed),
        ),
        "",
        transfers.length ? "รายการที่ต้องโอน" : "✓ ไม่มียอดค้างชำระ",
        ...transfers.map(
          (t) => member(t.from) + " → " + member(t.to) + " ฿" + money(t.amount),
        ),
        "ชำระแล้ว " + trip.settlements.length + " รายการ",
        "สรุปโดย SplitUp · หารกัน",
      ].join("\n")
    : "";
  const copy = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setStatus("คัดลอกแล้ว");
    } catch {
      setError("คัดลอกไม่ได้ กรุณาเลือกและคัดลอกข้อความด้วยตนเอง");
    }
  };
  const share = async () => {
    if (Platform.OS === "web") {
      setDialog({ kind: "share" });
      return;
    }
    try {
      await Share.share({ message: shareText });
    } catch {
      setDialog({ kind: "share" });
    }
  };
  const saveMember = async () => {
    if (!trip) return;
    const name = memberName.trim();
    if (!name) {
      setError("กรอกชื่อสมาชิก");
      return;
    }
    if (trip.members.some((m) => m.name === name && m.id !== editMember)) {
      setError("มีชื่อนี้ในทริปแล้ว");
      return;
    }
    const next = {
      ...trip,
      members: editMember
        ? trip.members.map((m) => (m.id === editMember ? { ...m, name } : m))
        : [...trip.members, { id: randomUUID(), name }],
    };
    if (await update(next)) {
      setMemberName("");
      setEditMember(null);
    }
  };
  const choose = (id: string) => {
    setSelected(id);
    setTab("home");
    setQuery("");
    setFilter("all");
    setMemberName("");
    setEditMember(null);
    setError("");
  };

  const expenseList = (list: Expense[]) =>
    list.length ? (
      list.map((e) => {
        const categoryIcons: Record<string, IconName> = {
          food: "food",
          travel: "travel",
          hotel: "hotel",
          coffee: "coffee",
          ticket: "ticket",
        };
        const categoryColors: Record<string, string> = {
          food: "#F8EBDC",
          travel: "#E7EEF9",
          hotel: "#EEE8F7",
          coffee: "#F7E7E9",
          ticket: "#F4F0DC",
        };
        return (
          <Pressable
            key={e.id}
            accessibilityRole="button"
            accessibilityLabel={e.name + " " + money(e.amount) + " บาท"}
            onPress={() => setDialog({ kind: "detail", expense: e })}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#F2F6EE" : "#fff",
              padding: compact ? 16 : 20,
              borderBottomWidth: 1,
              borderColor: "#EFF2EB",
            })}
          >
            <View style={[s.row, { gap: 12, alignItems: "center" }]}>
              <View
                style={{
                  width: 40,
                  height: 44,
                  borderRadius: 13,
                  backgroundColor: categoryColors[e.category] || colors.pale,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon
                  name={categoryIcons[e.category] || "receipt"}
                  color={
                    e.category === "food"
                      ? "#AA7D45"
                      : e.category === "coffee"
                        ? "#B77488"
                        : colors.green
                  }
                  size={21}
                />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                <Text numberOfLines={1} style={s.label}>
                  {e.name}
                </Text>
                <Text numberOfLines={1} style={[s.muted, { fontSize: 11 }]}>
                  {member(e.payerId)} จ่าย · {e.date.slice(5).replace("-", "/")}
                </Text>
              </View>
              <View style={{ maxWidth: "45%", alignItems: "flex-end", gap: 3 }}>
                <Text style={[s.label, { fontFamily: fonts.semibold }]}>
                  ฿{money(e.amount)}
                </Text>
                <Text style={[s.muted, { fontSize: 10 }]}>
                  หาร {Object.keys(e.shares).length} คน
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })
    ) : (
      <View style={{ padding: 28, gap: 12, alignItems: "center" }}>
        <Icon name="receipt" size={30} />
        <Text style={s.muted}>
          ยังไม่มีรายการที่ตรงกัน เพิ่มค่าใช้จ่ายแรกกันเลย
        </Text>
      </View>
    );
  if (!loaded)
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          justifyContent: "center",
          padding: 24,
          gap: 16,
        }}
      >
        {loadError ? (
          <>
            <Text style={s.error}>{loadError}</Text>
            <Button title="ลองอ่านข้อมูลอีกครั้ง" onPress={() => void load()} />
          </>
        ) : (
          <ActivityIndicator
            color={colors.green}
            accessibilityLabel="กำลังโหลดข้อมูล"
          />
        )}
      </SafeAreaView>
    );
  return (
    <>
      <AppShell
        tab={tab}
        onTab={setTab}
        onData={() => setDialog({ kind: "data" })}
        busy={busy}
        status={status}
      >
        {!!error && (
          <Pressable onPress={() => setError("")}>
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          </Pressable>
        )}
        {!trip && tab !== "history" && (
          <Card>
            <Text style={s.heading}>เริ่มทริปแรกของคุณ</Text>
            <Button
              title="+ สร้างทริป"
              onPress={() => setDialog({ kind: "trip" })}
            />
          </Card>
        )}
        {tab === "history" && (
          <>
            <View style={s.row}>
              <Text style={[s.title, { flex: 1 }]}>ทริปทั้งหมด</Text>
              <Button
                title="+ สร้างทริป"
                disabled={busy || trips.length >= 100}
                onPress={() => setDialog({ kind: "trip" })}
              />
            </View>
            {trips.length === 0 && <Text style={s.muted}>ยังไม่มีทริป</Text>}
            <Grid>
              {trips.map((t) => (
                <Pressable
                  key={t.id}
                  accessibilityRole="button"
                  onPress={() => choose(t.id)}
                >
                  <Card>
                    <Text style={s.heading}>{t.name}</Text>
                    <Text style={s.muted}>
                      {t.date} · {t.members.length} คน · {t.expenses.length}{" "}
                      รายการ
                    </Text>
                    <Text
                      style={{
                        fontSize: 25,
                        color: colors.green,
                        fontFamily: fonts.bold,
                      }}
                    >
                      ฿{money(t.expenses.reduce((n, e) => n + e.amount, 0))}
                    </Text>
                  </Card>
                </Pressable>
              ))}
            </Grid>
          </>
        )}
        {trip && tab !== "history" && (
          <>
            <PageHeader trip={trip} onShare={() => void share()} />

            {tab === "home" && (
              <Overview
                trip={trip}
                total={total}
                transfers={transfers}
                onAdd={() => setDialog({ kind: "expense" })}
                onSummary={() => setTab("summary")}
                onExpenses={() => setTab("expenses")}
                expenseList={expenseList(
                  [...trip.expenses].reverse().slice(0, 5),
                )}
                busy={busy}
              />
            )}
            {tab === "expenses" && (
              <>
                <Button
                  title="+ เพิ่มค่าใช้จ่าย"
                  disabled={busy}
                  onPress={() => setDialog({ kind: "expense" })}
                />
                <Field label="ค้นหารายการ" value={query} onChange={setQuery} />
                <Chips
                  options={[["all", "ทั้งหมด"], ...categories]}
                  value={filter}
                  onChange={setFilter}
                />
                {expenseList(
                  [...trip.expenses]
                    .reverse()
                    .filter(
                      (e) =>
                        e.name.toLowerCase().includes(query.toLowerCase()) &&
                        (filter === "all" || filter === e.category),
                    ),
                )}
              </>
            )}
            {tab === "summary" && (
              <>
                <Text style={s.heading}>สรุปของแต่ละคน</Text>
                <Grid>
                  {people.map((p) => (
                    <Card key={p.id}>
                      <View style={[s.row, { flexWrap: "wrap" }]}>
                        <Text style={[s.heading, { flex: 1, minWidth: 90 }]}>
                          {p.name}
                        </Text>
                        <Text
                          style={{
                            color: p.remaining < 0 ? "#B45C37" : colors.green,
                            fontFamily: fonts.bold,
                          }}
                        >
                          {p.remaining > 0
                            ? "รับคืน"
                            : p.remaining < 0
                              ? "จ่ายเพิ่ม"
                              : "ลงตัว"}{" "}
                          ฿{money(Math.abs(p.remaining))}
                        </Text>
                      </View>
                      <Text style={s.muted}>
                        จ่ายไป ฿{money(p.paid)} · ใช้จริง ฿{money(p.owed)}
                      </Text>
                    </Card>
                  ))}
                </Grid>
                <Text style={s.heading}>โอนตามนี้ได้เลย</Text>
                {!transfers.length && (
                  <Card>
                    <Text style={s.text}>✓ ไม่มียอดค้างชำระ</Text>
                  </Card>
                )}
                <Grid>
                  {transfers.map((t) => (
                    <Card key={t.from + t.to}>
                      <Text style={s.heading}>
                        {member(t.from)} → {member(t.to)}
                      </Text>
                      <Text style={s.title}>฿{money(t.amount)}</Text>
                      <Button
                        title="บันทึกว่าชำระแล้ว"
                        disabled={busy}
                        onPress={() =>
                          confirm(
                            "ยืนยันว่า " +
                              member(t.from) +
                              " โอนให้ " +
                              member(t.to) +
                              " ฿" +
                              money(t.amount) +
                              " แล้ว",
                            () => {
                              void update({
                                ...trip,
                                settlements: [
                                  ...trip.settlements,
                                  {
                                    ...t,
                                    id: randomUUID(),
                                    paidAt: new Date().toISOString(),
                                  },
                                ],
                              }).then((ok) => {
                                if (ok) setDialog(null);
                              });
                            },
                          )
                        }
                      />
                    </Card>
                  ))}
                </Grid>
                {!!trip.settlements.length && (
                  <Text style={s.heading}>ประวัติชำระเงิน</Text>
                )}
                {trip.settlements.map((t) => (
                  <Card key={t.id}>
                    <Text style={s.text}>
                      {member(t.from)} → {member(t.to)} · ฿{money(t.amount)}
                    </Text>
                    <Text style={s.muted}>
                      {new Date(t.paidAt).toLocaleString("th-TH")}
                    </Text>
                    <Button
                      title="ยกเลิกสถานะชำระแล้ว"
                      secondary
                      disabled={busy}
                      onPress={() =>
                        confirm("ยกเลิกการบันทึกชำระรายการนี้?", () => {
                          void update({
                            ...trip,
                            settlements: trip.settlements.filter(
                              (x) => x.id !== t.id,
                            ),
                          }).then((ok) => {
                            if (ok) setDialog(null);
                          });
                        })
                      }
                    />
                  </Card>
                ))}
              </>
            )}
            {tab === "members" && (
              <>
                <Card>
                  <Field
                    label={editMember ? "แก้ไขชื่อสมาชิก" : "เพิ่มสมาชิก"}
                    value={memberName}
                    onChange={setMemberName}
                  />
                  <Button
                    title="บันทึกสมาชิก"
                    disabled={
                      busy || (!editMember && trip.members.length >= 50)
                    }
                    onPress={() => void saveMember()}
                  />
                  {editMember && (
                    <Button
                      title="ยกเลิกการแก้ไข"
                      secondary
                      onPress={() => {
                        setEditMember(null);
                        setMemberName("");
                      }}
                    />
                  )}
                </Card>
                <Grid>
                  {trip.members.map((m, i) => (
                    <Card key={m.id}>
                      <View style={[s.row, { flexWrap: "wrap" }]}>
                        <View
                          style={{
                            backgroundColor: "#EAF1E7",
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Text style={s.heading}>{i + 1}</Text>
                        </View>
                        <Text style={[s.heading, { flex: 1, minWidth: 100 }]}>
                          {m.name}
                        </Text>
                        <Button
                          title="แก้ไข"
                          secondary
                          onPress={() => {
                            setMemberName(m.name);
                            setEditMember(m.id);
                          }}
                        />
                        <Button
                          title="ลบ"
                          danger
                          disabled={busy}
                          onPress={() => {
                            if (
                              trip.members.length === 1 ||
                              trip.expenses.some(
                                (e) => e.payerId === m.id || m.id in e.shares,
                              ) ||
                              trip.settlements.some(
                                (t) => t.from === m.id || t.to === m.id,
                              )
                            ) {
                              setError(
                                "ลบไม่ได้: ต้องเหลือสมาชิกอย่างน้อย 1 คน และสมาชิกต้องไม่มีรายการเกี่ยวข้อง",
                              );
                              return;
                            }
                            confirm("ลบสมาชิก " + m.name + "?", () => {
                              void update({
                                ...trip,
                                members: trip.members.filter(
                                  (x) => x.id !== m.id,
                                ),
                              }).then((ok) => {
                                if (ok) {
                                  setDialog(null);
                                  setEditMember(null);
                                  setMemberName("");
                                }
                              });
                            });
                          }}
                        />
                      </View>
                    </Card>
                  ))}
                </Grid>
              </>
            )}
          </>
        )}
      </AppShell>
      {dialog && (
        <Sheet
          title={
            dialog.kind === "trip"
              ? "สร้างทริปใหม่"
              : dialog.kind === "expense"
                ? dialog.expense
                  ? "แก้ไขค่าใช้จ่าย"
                  : "เพิ่มค่าใช้จ่าย"
                : dialog.kind === "detail"
                  ? "รายละเอียดค่าใช้จ่าย"
                  : dialog.kind === "data"
                    ? "สำรอง / ย้ายข้อมูล"
                    : dialog.kind === "confirm"
                      ? "ยืนยันรายการ"
                      : "แชร์สรุป"
          }
          onClose={close}
        >
          {!!error && (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          )}
          {busy && <ActivityIndicator color={colors.green} />}
          {dialog.kind === "trip" && (
            <TripForm
              onSave={(t) => {
                void commit([...current.current, t]).then((ok) => {
                  if (ok) {
                    choose(t.id);
                    setDialog(null);
                  }
                });
              }}
            />
          )}
          {dialog.kind === "expense" && trip && (
            <ExpenseForm
              trip={trip}
              expense={dialog.expense}
              onSave={(e) => {
                void update({
                  ...trip,
                  expenses: dialog.expense
                    ? trip.expenses.map((x) => (x.id === e.id ? e : x))
                    : [...trip.expenses, e],
                }).then((ok) => {
                  if (ok) setDialog(null);
                });
              }}
            />
          )}
          {dialog.kind === "detail" && trip && (
            <>
              <Text style={s.title}>{dialog.expense.name}</Text>
              <Text style={[s.title, { fontSize: 34, color: colors.green }]}>
                ฿{money(dialog.expense.amount)}
              </Text>
              <Text style={s.text}>
                {member(dialog.expense.payerId)} เป็นคนจ่าย ·{" "}
                {dialog.expense.date}
              </Text>
              <Text style={s.muted}>
                {categories.find(
                  (c) => c[0] === dialog.expense.category,
                )?.[1] || dialog.expense.category}
              </Text>
              {Object.entries(dialog.expense.shares).map(([id, n]) => (
                <Text key={id} style={s.text}>
                  {member(id)} · ฿{money(n)}
                </Text>
              ))}
              <Button
                title="แก้ไขรายการ"
                onPress={() =>
                  setDialog({ kind: "expense", expense: dialog.expense })
                }
              />
              <Button
                title="ลบรายการ"
                danger
                onPress={() => {
                  const e = dialog.expense;
                  confirm(
                    "ลบ " + e.name + "? ประวัติเงินที่โอนแล้วจะยังคงอยู่",
                    () => {
                      void update({
                        ...trip,
                        expenses: trip.expenses.filter((x) => x.id !== e.id),
                      }).then((ok) => {
                        if (ok) setDialog(null);
                      });
                    },
                  );
                }}
              />
            </>
          )}
          {dialog.kind === "confirm" && (
            <>
              <Text style={s.text}>{dialog.text}</Text>
              <Button title="ยืนยัน" disabled={busy} onPress={dialog.action} />
              <Button
                title="ยกเลิก"
                secondary
                disabled={busy}
                onPress={close}
              />
            </>
          )}
          {dialog.kind === "share" && (
            <>
              <Text selectable style={s.text}>
                {shareText}
              </Text>
              <Button title="คัดลอกสรุป" onPress={() => void copy(shareText)} />
              <Text style={s.muted}>{status}</Text>
            </>
          )}
          {dialog.kind === "data" && (
            <>
              <Text style={s.text}>
                สำรองทริปทั้งหมดเป็น JSON หรือวางข้อมูลจาก SplitExpense
                เพื่อนำเข้ามาในอุปกรณ์นี้
              </Text>
              <Button
                title="คัดลอกข้อมูลทั้งหมด (JSON)"
                onPress={() => void copy(JSON.stringify(trips, null, 2))}
              />
              <Text style={s.muted}>{status}</Text>
              <Field
                label="วาง JSON ของทริปที่ต้องการนำเข้า"
                value={importText}
                onChange={setImportText}
                multiline
              />
              <Text style={s.muted}>
                การนำเข้าจะแทนที่ทริปในอุปกรณ์นี้ ควรสำรองข้อมูลก่อน
              </Text>
              <Button
                title="ตรวจสอบและนำเข้า"
                disabled={busy}
                onPress={() => {
                  try {
                    const data: unknown = JSON.parse(importText);
                    validateTrips(data);
                    confirm(
                      "แทนที่ข้อมูลปัจจุบันด้วย " + data.length + " ทริป?",
                      () => {
                        void commit(data).then((ok) => {
                          if (ok) {
                            setSelected(data[0]?.id || "");
                            setTab("history");
                            setDialog(null);
                            setImportText("");
                          }
                        });
                      },
                    );
                  } catch (e) {
                    setError("นำเข้าไม่ได้: " + (e as Error).message);
                  }
                }}
              />
            </>
          )}
        </Sheet>
      )}
    </>
  );
}
