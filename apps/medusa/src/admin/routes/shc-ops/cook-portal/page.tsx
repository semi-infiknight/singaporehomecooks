import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Label, Switch, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState, type ReactNode } from "react"
import { shcGet, shcPost, errMessage } from "../../../lib/shc-api"
import { withShcQuery, invalidateShcOpsDashboard } from "../../../lib/shc-query"
import { shcOpsLiveQuery } from "../../../lib/shc-ops-polling"

type CookConfig = {
  greeting: { morning: string; afternoon: string; evening: string }
  dashboard_tiles: Array<Record<string, unknown>>
  compliance_course_links: Array<Record<string, unknown>>
  allergen_tier1_presets: string[]
  collection_time_slot_presets: string[]
  chat_quick_replies: { customer: string[]; cook: string[] }
}

const ShcOpsCookPortalPage = () => {
  const qc = useQueryClient()
  const configQ = useQuery({
    queryKey: ["shc-ops", "cook-config"],
    queryFn: () => shcGet<{ config: CookConfig }>("/admin/shc/cook-config"),
    ...shcOpsLiveQuery,
  })

  const [greeting, setGreeting] = useState({ morning: "", afternoon: "", evening: "" })
  const [allergens, setAllergens] = useState("")
  const [timeSlots, setTimeSlots] = useState("")
  const [customerReplies, setCustomerReplies] = useState("")
  const [cookReplies, setCookReplies] = useState("")
  const [linkForm, setLinkForm] = useState({
    id: "",
    title: "",
    description: "",
    url: "",
    for: "both",
  })
  const [tileForm, setTileForm] = useState({
    id: "",
    label: "",
    icon_key: "orders",
    image_key: "orders",
    variant: "bento-mint",
    mobile_href: "",
    web_href: "",
    sort_order: "10",
  })

  useEffect(() => {
    const cfg = configQ.data?.config
    if (!cfg) return
    setGreeting(cfg.greeting)
    setAllergens(cfg.allergen_tier1_presets.join("\n"))
    setTimeSlots(cfg.collection_time_slot_presets.join("\n"))
    setCustomerReplies(cfg.chat_quick_replies.customer.join("\n"))
    setCookReplies(cfg.chat_quick_replies.cook.join("\n"))
  }, [configQ.data])

  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) => shcPost("/admin/shc/cook-config", payload),
    onSuccess: () => {
      toast.success("Cook portal config saved")
      void invalidateShcOpsDashboard(qc)
    },
    onError: (e) => toast.error(errMessage(e)),
  })

  const cfg = configQ.data?.config
  const tiles = cfg?.dashboard_tiles || []
  const links = cfg?.compliance_course_links || []

  const lines = (raw: string) =>
    raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1">Cook portal</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Dashboard tiles, compliance links, listing presets, chat quick replies, greeting copy
          </Text>
        </div>
        <Button size="small" variant="secondary" onClick={() => void configQ.refetch()} isLoading={configQ.isFetching}>
          Refresh
        </Button>
      </div>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Greeting copy</Heading>
        </div>
        <div className="grid grid-cols-1 gap-3 px-6 py-4 small:grid-cols-3">
          <Field label="Morning">
            <Input value={greeting.morning} onChange={(e) => setGreeting({ ...greeting, morning: e.target.value })} />
          </Field>
          <Field label="Afternoon">
            <Input value={greeting.afternoon} onChange={(e) => setGreeting({ ...greeting, afternoon: e.target.value })} />
          </Field>
          <Field label="Evening">
            <Input value={greeting.evening} onChange={(e) => setGreeting({ ...greeting, evening: e.target.value })} />
          </Field>
        </div>
        <div className="flex justify-end px-6 py-4">
          <Button
            size="small"
            isLoading={save.isPending}
            onClick={() =>
              save.mutate({
                greeting,
                allergen_tier1_presets: lines(allergens),
                collection_time_slot_presets: lines(timeSlots),
                chat_quick_replies: { customer: lines(customerReplies), cook: lines(cookReplies) },
              })
            }
          >
            Save greeting & presets
          </Button>
        </div>
      </Container>

      <div className="grid grid-cols-1 gap-4 large:grid-cols-2">
        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Listing presets</Heading>
          </div>
          <div className="space-y-4 px-6 py-4">
            <Field label="Allergen tier-1 (one per line)">
              <Textarea rows={8} value={allergens} onChange={(e) => setAllergens(e.target.value)} />
            </Field>
            <Field label="Collection time slots (one per line)">
              <Textarea rows={5} value={timeSlots} onChange={(e) => setTimeSlots(e.target.value)} />
            </Field>
          </div>
        </Container>

        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Chat quick replies</Heading>
          </div>
          <div className="space-y-4 px-6 py-4">
            <Field label="Customer (one per line)">
              <Textarea rows={5} value={customerReplies} onChange={(e) => setCustomerReplies(e.target.value)} />
            </Field>
            <Field label="Cook (one per line)">
              <Textarea rows={5} value={cookReplies} onChange={(e) => setCookReplies(e.target.value)} />
            </Field>
          </div>
        </Container>
      </div>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Dashboard bento tiles</Heading>
        </div>
        <div className="space-y-2 px-6 py-4">
          {tiles.map((tile) => (
            <Text key={String(tile.id)} size="small">
              {String(tile.label)} · {String(tile.web_href)} · sort {String(tile.sort_order)}
            </Text>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 px-6 py-4 small:grid-cols-3">
          <Field label="Id">
            <Input value={tileForm.id} onChange={(e) => setTileForm({ ...tileForm, id: e.target.value })} />
          </Field>
          <Field label="Label">
            <Input value={tileForm.label} onChange={(e) => setTileForm({ ...tileForm, label: e.target.value })} />
          </Field>
          <Field label="Sort">
            <Input value={tileForm.sort_order} onChange={(e) => setTileForm({ ...tileForm, sort_order: e.target.value })} />
          </Field>
          <Field label="Mobile href">
            <Input value={tileForm.mobile_href} onChange={(e) => setTileForm({ ...tileForm, mobile_href: e.target.value })} />
          </Field>
          <Field label="Web href">
            <Input value={tileForm.web_href} onChange={(e) => setTileForm({ ...tileForm, web_href: e.target.value })} />
          </Field>
          <Field label="Variant">
            <Input value={tileForm.variant} onChange={(e) => setTileForm({ ...tileForm, variant: e.target.value })} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4">
          <Button
            size="small"
            variant="secondary"
            onClick={() =>
              save.mutate({
                dashboard_tiles: [
                  ...tiles.filter((t) => t.id !== tileForm.id),
                  {
                    ...tileForm,
                    icon_key: tileForm.icon_key,
                    image_key: tileForm.image_key,
                    enabled: true,
                    sort_order: Number(tileForm.sort_order) || 10,
                  },
                ],
              })
            }
          >
            Upsert tile
          </Button>
        </div>
      </Container>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Compliance course links</Heading>
        </div>
        <div className="space-y-2 px-6 py-4">
          {links.map((link) => (
            <Text key={String(link.id)} size="small">
              {String(link.title)} · {String(link.url)}
            </Text>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 px-6 py-4 small:grid-cols-2">
          <Field label="Id">
            <Input value={linkForm.id} onChange={(e) => setLinkForm({ ...linkForm, id: e.target.value })} />
          </Field>
          <Field label="For (sfa/wsq/both)">
            <Input value={linkForm.for} onChange={(e) => setLinkForm({ ...linkForm, for: e.target.value })} />
          </Field>
          <Field label="Title">
            <Input value={linkForm.title} onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })} />
          </Field>
          <Field label="URL">
            <Input value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} />
          </Field>
          <Field label="Description">
            <Input
              value={linkForm.description}
              onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
            />
          </Field>
        </div>
        <div className="flex justify-end px-6 py-4">
          <Button
            size="small"
            variant="secondary"
            onClick={() =>
              save.mutate({
                compliance_course_links: [
                  ...links.filter((l) => l.id !== linkForm.id),
                  linkForm,
                ],
              })
            }
          >
            Upsert compliance link
          </Button>
        </div>
      </Container>
    </div>
  )
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <Label>{label}</Label>
    {children}
  </div>
)

export const config = defineRouteConfig({
  label: "Cook portal",
  rank: 5,
})

export const handle = {
  breadcrumb: () => "Cook portal",
}

export default withShcQuery(ShcOpsCookPortalPage)
