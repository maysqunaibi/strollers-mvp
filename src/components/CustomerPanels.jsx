import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  VStack,
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { Activity, Package } from "lucide-react";
import { getSiteSlots, getSiteMeals } from "../lib/api";
import stroller from "../assets/stroller.webp";
function translateMealName(rawName) {
  if (!rawName) return rawName;

  if (rawName.includes("推荐启动套餐")) return "Recommended Start Package";

  const match = rawName.match(/启动套餐(\d+)/);
  if (match) {
    return `Start Package ${match[1]}`;
  }

  return rawName;
}

function replaceCurrencyUnit(unit) {
  return unit === "元" ? "SAR" : unit;
}

function replaceCoinUnit(unit) {
  return unit === "币" ? "Points" : unit;
}

function SlotPill({ s, selected, onSelect }) {
  const isAvailable = s.status === "REGISTER";
  const label = isAvailable ? "Available" : "In Use";
  const tone = isAvailable ? "green" : "red";

  return (
    <WrapItem>
      <Box textAlign="center">
        <Tag
          size="lg"
          variant={selected ? "solid" : "subtle"}
          colorScheme={tone}
          cursor={isAvailable ? "pointer" : "not-allowed"}
          opacity={isAvailable ? 1 : 0.5}
          onClick={() => isAvailable && onSelect(s)}
        >
          <TagLabel>
            {label} · {s.orders}
          </TagLabel>
        </Tag>
        <Box mt={2}>
          <img
            src={stroller}
            alt="Stroller"
            style={{ width: "100px", margin: "0 auto" }}
          />
        </Box>
      </Box>
    </WrapItem>
  );
}

function MealPill({ m, selected, onSelect }) {
  const displayName = translateMealName(m.setMealName);
  const currency = replaceCurrencyUnit(m.amountUnit);
  const coinUnit = replaceCoinUnit(m.coinUnit);

  return (
    <WrapItem>
      <Tag
        size="lg"
        variant={selected ? "solid" : "subtle"}
        colorScheme="purple"
        cursor="pointer"
        onClick={() => onSelect(m)}
      >
        <TagLabel>
          {displayName} · {m.amount}-{currency} / {m.coin} {coinUnit}
        </TagLabel>
      </Tag>
    </WrapItem>
  );
}

export default function CustomerPanels() {
  const defaultSite = useMemo(
    () => new URLSearchParams(location.search).get("siteNo") || "",
    []
  );
  const [siteNo] = useState(defaultSite);
  const [slots, setSlots] = useState([]);
  const [meals, setMeals] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    async function load() {
      if (!siteNo) return;
      try {
        const [slotsRes, mealsRes] = await Promise.all([
          getSiteSlots(siteNo),
          getSiteMeals(siteNo),
        ]);
        setSlots(slotsRes?.data || []);
        setMeals(mealsRes?.data?.setMealList || []);
      } catch (e) {
        toast({ status: "error", title: "Failed to load site info" });
      }
    }
    load();
  }, [siteNo, toast]);

  function handlePayment() {
    onOpen();
  }

  function confirmPayment() {
    toast({
      status: "success",
      title: `Payment successful for ${selectedMeal.amount} SAR`,
    });
    onClose();
    // In real flow: create order + open lock here
  }

  return (
    <VStack align="stretch" spacing={5}>
      <Card variant="outline" rounded="2xl">
        <CardHeader>
          <Heading size="md">Available Slots</Heading>
        </CardHeader>
        <CardBody>
          {slots.length === 0 ? (
            <Text fontSize="sm" color="gray.500">
              No slots found.
            </Text>
          ) : (
            <Wrap>
              {slots.map((s, i) => (
                <SlotPill
                  key={i}
                  s={s}
                  selected={selectedSlot?.orders === s.orders}
                  onSelect={setSelectedSlot}
                />
              ))}
            </Wrap>
          )}
        </CardBody>
      </Card>

      <Card variant="outline" rounded="2xl">
        <CardHeader>
          <Heading size="md">Packages</Heading>
        </CardHeader>
        <CardBody>
          {meals.length === 0 ? (
            <Text fontSize="sm" color="gray.500">
              No packages found.
            </Text>
          ) : (
            <Wrap>
              {meals.map((m, i) => (
                <MealPill
                  key={i}
                  m={m}
                  selected={selectedMeal?.id === m.id}
                  onSelect={setSelectedMeal}
                />
              ))}
            </Wrap>
          )}
        </CardBody>
      </Card>

      {selectedSlot && selectedMeal && (
        <Box p={3} borderWidth="1px" rounded="xl" bg="purple.50">
          <Text fontSize="sm" mb={2}>
            Selected slot: <b>{selectedSlot.orders}</b> | Package:{" "}
            <b>{selectedMeal.setMealName}</b> ({selectedMeal.amount} SAR /{" "}
            {selectedMeal.coin} points)
          </Text>
          <Button colorScheme="purple" onClick={handlePayment}>
            Proceed to Payment
          </Button>
        </Box>
      )}

      {/* Mock Payment Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Mock Payment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              You are about to pay <b>{selectedMeal?.amount} SAR</b> for package{" "}
              <b>{selectedMeal?.setMealName}</b>.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="purple" onClick={confirmPayment}>
              Confirm Payment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
