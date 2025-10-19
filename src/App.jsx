import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  SimpleGrid,
  HStack,
  VStack,
  Input,
  FormControl,
  FormLabel,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  useToast,
  Textarea,
  Image,
  Badge,
  Tooltip,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Sparkles,
  Link2,
  Unlink,
  Info,
  Activity,
  SlidersHorizontal,
  Coins,
  Package,
  PlusCircle,
  Building2,
  List,
  PenLine,
  Trash2,
  TerminalSquare,
} from "lucide-react";

// API layer
import {
  getSiteSlots,
  getLocalPackages,
  bindDevice,
  unbindDevice,
  getDeviceInfo,
  getDeviceStatus,
  getDeviceParams,
  addScore,
  addSite,
  listSites,
  updateSite,
  removeSite,
  getCartList,
  unlockCart,
  bindCarts,
  unbindCarts,
} from "./lib/api";
import CustomerPanels from "./components/CustomerPanels";
import OrdersPanel from "./components/OrdersPanel";
import CustomerReturn from "./components/CustomerReturn";
import freeLoc from "./assets/sublocation-free.webp";
import registeredLoc from "./assets/sublocation-registered.webp";

const MotionCard = motion(Card);

function Tile({ title, icon: Icon, onClick, active }) {
  return (
    <MotionCard
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      cursor="pointer"
      onClick={onClick}
      bg={active ? "purple.600" : "white"}
      color={active ? "white" : "gray.900"}
      shadow="lg"
      borderWidth="1px"
      borderColor={active ? "purple.600" : "gray.200"}
      rounded="2xl"
    >
      <CardBody>
        <HStack spacing={3} align="center">
          <Box
            bg={active ? "whiteAlpha.300" : "purple.50"}
            rounded="xl"
            p={2}
            color={active ? "white" : "purple.600"}
          >
            <Icon size={20} />
          </Box>
          <Heading size="sm" noOfLines={1}>
            {title}
          </Heading>
        </HStack>
      </CardBody>
    </MotionCard>
  );
}

function Field({ label, children }) {
  return (
    <FormControl>
      <FormLabel fontSize="sm" color="gray.700">
        {label}
      </FormLabel>
      {children}
    </FormControl>
  );
}

function SlotCard({ s, selected, onClick }) {
  // status: "FREE" | "REGISTER"
  const isRegistered = s.status === "REGISTER";
  const imgSrc = isRegistered ? registeredLoc : freeLoc;

  return (
    <Card
      onClick={() => onClick(String(s.orders))}
      cursor="pointer"
      rounded="lg"
      overflow="hidden"
      borderWidth="1px"
      borderColor={selected ? "purple.500" : "gray.200"}
      shadow={selected ? "lg" : "sm"}
      _hover={{ transform: "translateY(-2px)", shadow: "md" }}
      transition="all 0.15s ease"
    >
      <Image
        src={imgSrc}
        alt={isRegistered ? "Registered" : "Free"}
        h="190px"
        w="100%"
        objectFit="cover"
      />
      <CardBody py={2} px={3}>
        <HStack justify="space-between" align="center">
          <Heading size="sm">Location #{s.orders}</Heading>
          <Tooltip
            label={
              isRegistered ? "Device installed here" : "No device bound here"
            }
          >
            <Badge colorScheme={isRegistered ? "red" : "green"}>
              {isRegistered ? "Registered" : "Free"}
            </Badge>
          </Tooltip>
        </HStack>
      </CardBody>
    </Card>
  );
}

function OperatorPanels() {
  const defaultSite = useMemo(
    () => new URLSearchParams(location.search).get("siteNo") || "",
    []
  );
  const [siteNo, setSiteNo] = useState(defaultSite);
  const [deviceNo, setDeviceNo] = useState("");
  const [orders, setOrders] = useState("");
  const [coinsPerTime, setCoinsPerTime] = useState("");
  const [slots, setSlots] = useState([]);
  const [packages, setPackages] = useState([]);
  const [carts, setCarts] = useState([]);
  const [unlockIndex, setUnlockIndex] = useState("");
  const [selectedCartNo, setSelectedCartNo] = useState("");
  const [bindInput, setBindInput] = useState(""); // one IC per line
  const [unbindInput, setUnbindInput] = useState("");
  const [cartBusy, setCartBusy] = useState(false);
  const [loadingCarts, setLoadingCarts] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [log, setLog] = useState("Ready.");
  const toast = useToast();

  const logJSON = (obj) => setLog(JSON.stringify(obj, null, 2));

  async function loadAvailability() {
    if (!siteNo) return toast({ status: "warning", title: "Enter siteNo" });
    try {
      const [slotsRes, pkgsRes] = await Promise.all([
        getSiteSlots(siteNo),
        getLocalPackages(siteNo),
      ]);
      setSlots(slotsRes?.data || []);
      setPackages(pkgsRes || []);
      logJSON({ slotsRes, pkgsRes });
      toast({ status: "success", title: "Loaded" });
    } catch (e) {
      logJSON({ error: String(e) });
      toast({ status: "error", title: "Load failed" });
    }
  }

  async function handleBind() {
    const coinNum = Number(prompt("Coin number to add?", "1") || "");
    setCoinsPerTime(coinNum);
    if (!siteNo || !deviceNo || !orders || !coinsPerTime)
      return toast({ status: "warning", title: "Fill all fields" });
    try {
      const res = await bindDevice({
        siteNo,
        deviceNo,
        orders: Number(orders),
        coinsPerTime: Number(coinsPerTime),
      });
      logJSON(res);
      await loadAvailability();
      toast({ status: "success", title: "Bind sent" });
    } catch (e) {
      logJSON({ error: String(e) });
      toast({ status: "error", title: "Bind failed" });
    }
  }

  async function handleUnbind() {
    if (!deviceNo) return toast({ status: "warning", title: "Enter deviceNo" });
    try {
      const res = await unbindDevice({ deviceNo });
      logJSON(res);
      await loadAvailability();
      toast({ status: "success", title: "Unbind sent" });
    } catch (e) {
      logJSON({ error: String(e) });
      toast({ status: "error", title: "Unbind failed" });
    }
  }

  async function handleDeviceInfo() {
    if (!deviceNo) return toast({ status: "warning", title: "Enter deviceNo" });
    try {
      logJSON(await getDeviceInfo(deviceNo));
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }
  async function handleDeviceStatus() {
    if (!deviceNo) return toast({ status: "warning", title: "Enter deviceNo" });
    try {
      logJSON(await getDeviceStatus(deviceNo));
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }
  async function handleDeviceParams() {
    if (!deviceNo) return toast({ status: "warning", title: "Enter deviceNo" });
    try {
      logJSON(await getDeviceParams(deviceNo));
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }
  async function handleScore() {
    if (!deviceNo) return toast({ status: "warning", title: "Enter deviceNo" });
    const coinNum = Number(prompt("Coin number to add?", "1") || "");
    if (!coinNum) return;
    try {
      logJSON(await addScore({ deviceNo, coinNum, amount: coinNum }));
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }

  async function handleDefaultPackages() {
    if (!siteNo) return toast({ status: "warning", title: "Enter siteNo" });
    try {
      logJSON(await getLocalPackages(siteNo));
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }

  async function handleAddSite() {
    const siteName = prompt("Site name?", "Demo Site");
    const province = prompt("Province?", "");
    const city = prompt("City?", "");
    const county = prompt("County?", "");
    const address = prompt("Address?", "");
    const siteType = prompt("Site type? (SHOPPING_MALL etc.)", "SHOPPING_MALL");
    if (!siteName || !province || !city || !county || !address || !siteType)
      return;
    try {
      logJSON(
        await addSite({ siteName, province, city, county, address, siteType })
      );
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }
  async function handleListSites() {
    try {
      logJSON(await listSites());
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }
  async function handleUpdateSite() {
    if (!siteNo) return toast({ status: "warning", title: "Enter siteNo" });
    const siteName = prompt("New site name?", "Updated Site Name");
    const province = prompt("Province?", "");
    const city = prompt("City?", "");
    const county = prompt("County?", "");
    const address = prompt("Address?", "");
    const siteType = prompt("Site type? (SHOPPING_MALL)", "SHOPPING_MALL");
    if (!siteName || !province || !city || !county || !address) return;
    try {
      logJSON(
        await updateSite({
          siteNo,
          siteName,
          province,
          city,
          county,
          address,
          siteType,
        })
      );
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }
  const parseLines = (s) =>
    s
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

  async function loadCartList() {
    if (!deviceNo) return toast({ status: "warning", title: "Enter deviceNo" });
    setLoadingCarts(true);
    try {
      const res = await getCartList({ deviceNo });
      if (res?.code === "00000") {
        setCarts(res.data || []);
        logJSON({ cartList: res });
        toast({ status: "success", title: "Carts loaded" });
      } else {
        toast({ status: "error", title: res?.msg || "Load failed" });
        logJSON(res);
      }
    } catch (e) {
      toast({ status: "error", title: "Load failed" });
      logJSON({ error: String(e) });
    } finally {
      setLoadingCarts(false);
    }
  }

  async function handleUnlockCart() {
    if (!deviceNo)
      return toast({ status: "warning", title: "Device required" });

    const byIndex = carts.find((c) => String(c.index) === String(unlockIndex));
    const cartNo = selectedCartNo || byIndex?.cartNo || "";
    const cartIndexNum = Number(unlockIndex);

    if (!cartNo || !Number.isInteger(cartIndexNum)) {
      return toast({
        status: "warning",
        title: "Select a cart from the list (it will fill cartNo & index)",
      });
    }
    if (byIndex && byIndex.usedStatus === false) {
      return toast({
        status: "warning",
        title:
          "Selected slot is empty; pick a slot with a cart (Available=true)",
      });
    }

    setCartBusy(true);
    try {
      const res = await unlockCart({
        deviceNo,
        cartNo,
        cartIndex: cartIndexNum,
      });
      logJSON(res);
      if (res?.code === "00000") {
        toast({
          status: "success",
          title: `Unlock sent for slot #${cartIndexNum}`,
        });
        await loadCartList();
      } else {
        toast({ status: "error", title: res?.msg || "Unlock failed" });
      }
    } catch (e) {
      toast({ status: "error", title: "Unlock failed" });
      logJSON({ error: String(e) });
    } finally {
      setCartBusy(false);
    }
  }
  async function handleBindCarts() {
    const list = parseLines(bindInput);
    console.log("[BIND carts] parsed list:", list);
    if (!list.length)
      return toast({
        status: "warning",
        title: "Add IC card numbers (one per line)",
      });
    setCartBusy(true);
    try {
      const res = await bindCarts({ cartNo: list });
      logJSON(res);
      if (res?.code === "00000") {
        toast({ status: "success", title: "Carts bound" });
        setBindInput("");
        await loadCartList();
      } else {
        toast({ status: "error", title: res?.msg || "Bind failed" });
      }
    } catch (e) {
      toast({ status: "error", title: "Bind failed" });
      logJSON({ error: String(e) });
    } finally {
      setCartBusy(false);
    }
  }

  async function handleUnbindCarts() {
    const list = parseLines(unbindInput);
    if (!list.length)
      return toast({
        status: "warning",
        title: "Add IC card numbers (one per line)",
      });
    setCartBusy(true);
    try {
      const res = await unbindCarts({ cartNo: list });
      logJSON(res);
      if (res?.code === "00000") {
        toast({ status: "success", title: "Carts unbound" });
        setUnbindInput("");
        await loadCartList();
      } else {
        toast({ status: "error", title: res?.msg || "Unbind failed" });
      }
    } catch (e) {
      toast({ status: "error", title: "Unbind failed" });
      logJSON({ error: String(e) });
    } finally {
      setCartBusy(false);
    }
  }

  async function handleRemoveSite() {
    if (!siteNo) return toast({ status: "warning", title: "Enter siteNo" });
    if (!confirm(`Remove site ${siteNo}?`)) return;
    try {
      logJSON(await removeSite({ siteNo }));
    } catch (e) {
      logJSON({ error: String(e) });
    }
  }

  const [open, setOpen] = useState("site"); 

  return (
    <VStack align="stretch" spacing={5}>
      {/* Tiles */}
      <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
        <Tile
          title="Device Ops"
          icon={SlidersHorizontal}
          onClick={() => setOpen("device")}
          active={open === "device"}
        />
        <Tile
          title="Cart Ops"
          icon={List}
          onClick={() => setOpen("cart")}
          active={open === "cart"}
        />
        <Tile
          title="Set Packages"
          icon={Package}
          onClick={() => setOpen("package")}
          active={open === "package"}
        />
        <Tile
          title="Sites CRUD"
          icon={Building2}
          onClick={() => setOpen("crud")}
          active={open === "crud"}
        />
        <Tile
          title="Orders"
          icon={List}
          onClick={() => setOpen("orders")}
          active={open === "orders"}
        />

        <Tile
          title="Console"
          icon={TerminalSquare}
          onClick={() => setShowConsole(!showConsole)}
          active={showConsole}
        />
      </SimpleGrid>
      {/* Details */}(
      <Card variant="outline" rounded="2xl">
        <CardHeader>
          <Heading size="md">Site Overview</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
            <Field label="Site No">
              <Input
                value={siteNo}
                onChange={(e) => setSiteNo(e.target.value)}
                placeholder="S001585"
              />
            </Field>
            <Field label="Device No">
              <Input
                value={deviceNo}
                onChange={(e) => setDeviceNo(e.target.value)}
                placeholder="01007008"
              />
            </Field>
            <Field label="Location (order)">
              <Input
                value={orders}
                onChange={(e) => setOrders(e.target.value)}
                placeholder="1"
              />
            </Field>
          </SimpleGrid>

          <HStack spacing={3} mt={4}>
            <Button
              leftIcon={<RefreshCw size={16} />}
              onClick={loadAvailability}
            >
              Load
            </Button>
            <Button
              leftIcon={<Sparkles size={16} />}
              variant="outline"
              onClick={handleDefaultPackages}
            >
              Default Packages
            </Button>
          </HStack>

          <SimpleGrid columns={1} spacing={4} mt={5}>
            <Box borderWidth="1px" rounded="xl" p={3}>
              <Heading size="sm" mb={2}>
                Locations (Site slots)
              </Heading>

              {slots.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  No Locations yet
                </Text>
              ) : (
                <SimpleGrid
                  columns={{ base: 2, md: 3, lg: 4 }}
                  minChildWidth="140px"
                  spacing={6}
                >
                  {slots.map((s, i) => (
                    <SlotCard
                      key={i}
                      s={s}
                      selected={String(orders) === String(s.orders)}
                      onClick={(val) => {
                        setOrders(val);
                      }}
                    />
                  ))}
                </SimpleGrid>
              )}
              <HStack spacing={4} mt={3}>
                <HStack>
                  <Box w="10px" h="10px" bg="purple.500" rounded="sm" />
                  <Text fontSize="xs">Registered (device installed)</Text>
                </HStack>
                <HStack>
                  <Box w="10px" h="10px" bg="gray.400" rounded="sm" />
                  <Text fontSize="xs">Free (empty location)</Text>
                </HStack>
              </HStack>
            </Box>
            <Box borderWidth="1px" rounded="xl" p={3}>
              <Heading size="sm" mb={2}>
                Packages (LAUNCH)
              </Heading>
              {packages.length === 0 || !packages ? (
                <Text fontSize="sm" color="gray.500">
                  No data
                </Text>
              ) : (
                <Wrap>
                  {packages.map((p, i) => (
                    <WrapItem key={i}>
                      <Tag
                        size="lg"
                        variant="subtle"
                        colorScheme={p.recommended ? "purple" : "gray"}
                      >
                        <TagLabel>
                          {p.name} · {(p.amount_halalas / 100).toFixed(2)} SAR ·{" "}
                          {p.duration_minutes} min
                        </TagLabel>
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              )}
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>
      )
      {open === "device" && (
        <Card variant="outline" rounded="2xl">
          <CardHeader>
            <Heading size="md">Device Operations</Heading>
          </CardHeader>
          <CardBody>
            <HStack spacing={3} wrap="wrap">
              <Button
                colorScheme="purple"
                leftIcon={<Link2 size={16} />}
                onClick={handleBind}
              >
                Bind (install)
              </Button>
              <Button leftIcon={<Unlink size={16} />} onClick={handleUnbind}>
                Unbind (remove)
              </Button>
              <Button leftIcon={<Info size={16} />} onClick={handleDeviceInfo}>
                Device Info
              </Button>
              <Button
                leftIcon={<Activity size={16} />}
                onClick={handleDeviceStatus}
              >
                Device Status
              </Button>
              <Button
                leftIcon={<SlidersHorizontal size={16} />}
                onClick={handleDeviceParams}
              >
                Device Params
              </Button>
              <Button leftIcon={<Coins size={16} />} onClick={handleScore}>
                Score (+coins)
              </Button>
            </HStack>
          </CardBody>
        </Card>
      )}
      {open === "cart" && (
        <Card variant="outline" rounded="2xl">
          <CardHeader>
            <Heading size="md">Cart Operations</Heading>
          </CardHeader>
          <CardBody>
            <HStack spacing={3} mb={4}>
              <Button
                leftIcon={<List size={16} />}
                onClick={loadCartList}
                isLoading={loadingCarts}
              >
                Load carts for device
              </Button>
            </HStack>

            {/* Current carts list */}
            <Box borderWidth="1px" rounded="xl" p={3} mb={5}>
              <Heading size="sm" mb={2}>
                Carts in device
              </Heading>
              {!carts || carts.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  No carts loaded yet.
                </Text>
              ) : (
                <Wrap>
                  {carts.map((c, i) => (
                    <WrapItem
                      key={i}
                      onClick={() => {
                        setUnlockIndex(String(c.index));
                        setSelectedCartNo(c.cartNo || "");
                      }}
                    >
                      <Tag
                        size="lg"
                        variant="subtle"
                        colorScheme={c.usedStatus ? "green" : "red"}
                      >
                        <TagLabel>
                          Slot #{c.index} ·{" "}
                          {c.usedStatus ? "Available" : "Not available"} · IC:
                          {c.cartNo || "—"}
                        </TagLabel>
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              )}
            </Box>

            <Box borderWidth="1px" rounded="xl" p={3} mb={5}>
              <Heading size="sm" mb={3}>
                Unlock (manual)
              </Heading>
              <HStack spacing={3}>
                <Field label="Cart Index">
                  <Input
                    value={unlockIndex}
                    onChange={(e) => setUnlockIndex(e.target.value)}
                    placeholder="e.g. 2"
                    maxW="140px"
                  />
                  <Text fontSize="sm" color="gray.600">
                    CartNo: {selectedCartNo || "—"}
                  </Text>
                </Field>
                <Button onClick={handleUnlockCart} isLoading={cartBusy}>
                  Unlock
                </Button>
              </HStack>
              <Text fontSize="xs" color="gray.500" mt={2}>
                Use after payment in Customer flow. This is a manual test
                shortcut.
              </Text>
            </Box>

            {/* Bind / Unbind */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box borderWidth="1px" rounded="xl" p={3}>
                <Heading size="sm" mb={3}>
                  Bind carts to merchant
                </Heading>
                <Field label="IC card numbers (one per line)">
                  <Textarea
                    rows={6}
                    value={bindInput}
                    onChange={(e) => setBindInput(e.target.value)}
                    placeholder={"15A451C1\n15A451C2"}
                  />
                </Field>
                <Button mt={3} onClick={handleBindCarts} isLoading={cartBusy}>
                  Bind
                </Button>
              </Box>

              <Box borderWidth="1px" rounded="xl" p={3}>
                <Heading size="sm" mb={3}>
                  Unbind carts from merchant
                </Heading>
                <Field label="IC card numbers (one per line)">
                  <Textarea
                    rows={6}
                    value={unbindInput}
                    onChange={(e) => setUnbindInput(e.target.value)}
                    placeholder={"15A451C1\n15A451C2"}
                  />
                </Field>
                <Button
                  mt={3}
                  onClick={handleUnbindCarts}
                  isLoading={cartBusy}
                  colorScheme="red"
                >
                  Unbind
                </Button>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
      )}
      {open === "orders" && <OrdersPanel />}
      {open === "package" && (
        <Card variant="outline" rounded="2xl">
          <CardHeader>
            <Heading size="md">Set Packages</Heading>
          </CardHeader>
          <CardBody>
            <HStack spacing={3} wrap="wrap">
              <Button
                leftIcon={<List size={16} />}
                variant="outline"
                onClick={loadAvailability}
              >
                Query (site)
              </Button>
              <Button
                leftIcon={<Sparkles size={16} />}
                variant="outline"
                onClick={handleDefaultPackages}
              >
                Default Packages
              </Button>
            </HStack>
          </CardBody>
        </Card>
      )}
      {open === "crud" && (
        <Card variant="outline" rounded="2xl">
          <CardHeader>
            <Heading size="md">Site Management</Heading>
          </CardHeader>
          <CardBody>
            <HStack spacing={3} wrap="wrap">
              <Button
                leftIcon={<Building2 size={16} />}
                onClick={handleAddSite}
              >
                Add Site
              </Button>
              <Button
                leftIcon={<List size={16} />}
                variant="outline"
                onClick={handleListSites}
              >
                Get Site List
              </Button>
              <Button
                leftIcon={<PenLine size={16} />}
                variant="outline"
                onClick={handleUpdateSite}
              >
                Update Site
              </Button>
              <Button
                leftIcon={<Trash2 size={16} />}
                colorScheme="red"
                onClick={handleRemoveSite}
              >
                Remove Site
              </Button>
            </HStack>
          </CardBody>
        </Card>
      )}
      {showConsole && (
        <Card variant="outline" rounded="2xl">
          <CardHeader>
            <Heading size="md">Console</Heading>
          </CardHeader>
          <CardBody>
            <Box
              as="pre"
              fontSize="xs"
              p={3}
              bg="gray.50"
              borderWidth="1px"
              rounded="xl"
              maxH="60vh"
              overflow="auto"
            >
              {log}
            </Box>
          </CardBody>
        </Card>
      )}
      <Box borderTopWidth="1px" borderColor="gray.200" />
    </VStack>
  );
}

export default function App() {
  if (window.location.pathname === "/pay/return") {
    return <CustomerReturn />;
  }
  const [tab, setTab] = useState("operator");
  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-b, gray.50, white)"
      color="gray.900"
    >
      <Box
        position="sticky"
        top={0}
        zIndex={10}
        borderBottomWidth="1px"
        bg="whiteAlpha.80"
        backdropFilter="saturate(180%) blur(8px)"
      >
        <Box
          maxW="6xl"
          mx="auto"
          px={4}
          py={3}
          display="flex"
          alignItems="center"
          gap={3}
        >
          <Heading
            size="md"
            bgClip="text"
            bgGradient="linear(to-r, purple.600, indigo.600)"
          >
            <Text color="gray.500">Shared Strollers – MVP</Text>
          </Heading>
          <HStack spacing={2} ml="auto">
            <Button
              variant={tab === "operator" ? "solid" : "outline"}
              colorScheme="purple"
              size="sm"
              onClick={() => setTab("operator")}
            >
              Operator
            </Button>
            <Button
              variant={tab === "customer" ? "solid" : "outline"}
              colorScheme="purple"
              size="sm"
              onClick={() => setTab("customer")}
            >
              Customer
            </Button>
          </HStack>
        </Box>
      </Box>

      <Box maxW="6xl" mx="auto" p={{ base: 4, md: 6 }}>
        {tab === "operator" ? <OperatorPanels /> : <CustomerPanels />}
      </Box>
    </Box>
  );
}
