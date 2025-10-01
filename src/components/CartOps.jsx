import { useState } from "react";
import {
  Box,
  Heading,
  Stack,
  HStack,
  SimpleGrid,
  Divider,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Button,
  Tag,
  TagLabel,
  Textarea,
  useToast,
  Badge,
  Text,
} from "@chakra-ui/react";
import { getCartList, unlockCart, bindCarts, unbindCarts } from "../lib/api";

export default function CartOps() {
  const [deviceNo, setDeviceNo] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [carts, setCarts] = useState([]);
  const [unlockIndex, setUnlockIndex] = useState("");
  const [bindInput, setBindInput] = useState(""); // one IC per line
  const [unbindInput, setUnbindInput] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = async () => {
    if (!deviceNo) return toast({ status: "warning", title: "Enter deviceNo" });
    setListLoading(true);
    try {
      const res = await getCartList(deviceNo);
      if (res?.code === "00000") {
        setCarts(res.data || []);
        toast({ status: "success", title: "Loaded carts" });
      } else {
        toast({ status: "error", title: res?.msg || "Load failed" });
      }
    } catch (e) {
      toast({ status: "error", title: "Load failed" });
    } finally {
      setListLoading(false);
    }
  };

  const doUnlock = async () => {
    if (!deviceNo || !unlockIndex)
      return toast({ status: "warning", title: "Device & index required" });
    setBusy(true);
    try {
      const res = await unlockCart({
        deviceNo,
        cartIndex: Number(unlockIndex),
      });
      if (res?.code === "00000") {
        toast({ status: "success", title: "Unlocked" });
        await load();
      } else {
        toast({ status: "error", title: res?.msg || "Unlock failed" });
      }
    } catch {
      toast({ status: "error", title: "Unlock failed" });
    } finally {
      setBusy(false);
    }
  };

  const parseLines = (s) =>
    s
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

  const doBind = async () => {
    const list = parseLines(bindInput);
    if (!list.length)
      return toast({
        status: "warning",
        title: "Add IC card numbers (one per line)",
      });
    setBusy(true);
    try {
      const res = await bindCarts(list);
      if (res?.code === "00000") {
        toast({ status: "success", title: "Carts bound" });
        setBindInput("");
        await load();
      } else {
        toast({ status: "error", title: res?.msg || "Bind failed" });
      }
    } catch {
      toast({ status: "error", title: "Bind failed" });
    } finally {
      setBusy(false);
    }
  };

  const doUnbind = async () => {
    const list = parseLines(unbindInput);
    if (!list.length)
      return toast({
        status: "warning",
        title: "Add IC card numbers (one per line)",
      });
    setBusy(true);
    try {
      const res = await unbindCarts(list);
      if (res?.code === "00000") {
        toast({ status: "success", title: "Carts unbound" });
        setUnbindInput("");
        await load();
      } else {
        toast({ status: "error", title: res?.msg || "Unbind failed" });
      }
    } catch {
      toast({ status: "error", title: "Unbind failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Heading size="md" mb={4}>
        HandCart Ops
      </Heading>

      <Stack spacing={6}>
        {/* Device selector + load */}
        <Box>
          <HStack align="end" spacing={4}>
            <FormControl maxW="320px">
              <FormLabel>Device No</FormLabel>
              <Input
                value={deviceNo}
                onChange={(e) => setDeviceNo(e.target.value)}
                placeholder="e.g. 01007008"
              />
            </FormControl>
            <Button onClick={load} isLoading={listLoading} colorScheme="purple">
              Load carts
            </Button>
          </HStack>
        </Box>

        {/* List */}
        <Box>
          <Heading size="sm" mb={3}>
            Carts in device
          </Heading>
          {!carts?.length ? (
            <Text color="gray.500">No carts loaded yet.</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
              {carts.map((c, idx) => (
                <HStack
                  key={idx}
                  p={3}
                  borderWidth="1px"
                  borderRadius="lg"
                  justify="space-between"
                >
                  <Stack spacing={0}>
                    <Text fontWeight="semibold">Slot #{c.index}</Text>
                    <Text fontSize="sm" color="gray.600">
                      IC: {c.cartNo || "—"}
                    </Text>
                  </Stack>
                  <Tag colorScheme={c.usedStatus ? "green" : "red"}>
                    <TagLabel>
                      {c.usedStatus ? "Available" : "Not available"}
                    </TagLabel>
                  </Tag>
                </HStack>
              ))}
            </SimpleGrid>
          )}
        </Box>

        <Divider />

        {/* Unlock */}
        <Box>
          <Heading size="sm" mb={3}>
            Unlock (manual test)
          </Heading>
          <HStack spacing={4} align="end">
            <FormControl maxW="200px">
              <FormLabel>Cart Index</FormLabel>
              <NumberInput
                min={1}
                value={unlockIndex}
                onChange={(_, v) => setUnlockIndex(v || "")}
              >
                <NumberInputField placeholder="e.g. 2" />
              </NumberInput>
            </FormControl>
            <Button onClick={doUnlock} isLoading={busy} colorScheme="teal">
              Unlock
            </Button>
          </HStack>
          <Badge mt={3} colorScheme="yellow">
            Use after payment in Customer flow
          </Badge>
        </Box>

        <Divider />

        {/* Bind / Unbind */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Box>
            <Heading size="sm" mb={3}>
              Bind carts (IC list)
            </Heading>
            <FormControl>
              <FormLabel>IC card numbers (one per line)</FormLabel>
              <Textarea
                rows={6}
                value={bindInput}
                onChange={(e) => setBindInput(e.target.value)}
                placeholder={"15A451C1\n15A451C2"}
              />
            </FormControl>
            <Button mt={3} onClick={doBind} isLoading={busy} colorScheme="blue">
              Bind
            </Button>
          </Box>

          <Box>
            <Heading size="sm" mb={3}>
              Unbind carts (IC list)
            </Heading>
            <FormControl>
              <FormLabel>IC card numbers (one per line)</FormLabel>
              <Textarea
                rows={6}
                value={unbindInput}
                onChange={(e) => setUnbindInput(e.target.value)}
                placeholder={"15A451C1\n15A451C2"}
              />
            </FormControl>
            <Button
              mt={3}
              onClick={doUnbind}
              isLoading={busy}
              colorScheme="red"
            >
              Unbind
            </Button>
          </Box>
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
