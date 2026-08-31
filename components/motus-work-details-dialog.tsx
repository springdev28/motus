'use client';

import { useState } from 'react';
import { BookOpenText, Compass, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { MOTUS_LIBRARY_WORKS } from '@/lib/motus-library';
import {
  MAX_PROJECT_DESCRIPTION_LENGTH,
  MAX_PROJECT_TITLE_LENGTH,
  MAX_READER_TRANSITION_DURATION_MS,
  MIN_READER_TRANSITION_DURATION_MS,
  createWorkMetadata,
  getProjectScenes,
  normalizeReaderPresentation,
  parseProjectTags,
  parseWorkMetadataItems,
  type ContentRating,
  type MotusProject,
  type MotusProjectFormat,
  type MotusWorkMetadata,
  type ReaderDirection,
  type ReaderTransitionStyle,
  type WorkOrigin,
  type WorkStatus,
} from '@/lib/motus-model';

type MetadataListField = Extract<
  keyof MotusWorkMetadata,
  | 'contributorNames'
  | 'genres'
  | 'characters'
  | 'relationships'
  | 'themes'
  | 'contentWarnings'
  | 'communityLinks'
>;

type MotusWorkDetailsDialogProps = {
  activeChapterId: string;
  endHistoryTransaction: () => void;
  onCommit: (
    mutate: (draft: MotusProject) => void,
    transactionKey?: string | null,
  ) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  project: MotusProject;
};

const metadataFieldCopy: Record<
  Exclude<MetadataListField, 'contributorNames'>,
  { label: string; placeholder: string; hint: string }
> = {
  genres: {
    label: 'Genres',
    placeholder: 'Fantasy, science fiction, romance',
    hint: 'Flexible discovery labels; they are not limited to a fixed list.',
  },
  characters: {
    label: 'Characters',
    placeholder: 'The Cartographer, The Signal',
    hint: 'Separate character names with commas.',
  },
  relationships: {
    label: 'Relationships',
    placeholder: 'A / B, mentor and student',
    hint: 'Use the wording readers would search for.',
  },
  themes: {
    label: 'Themes',
    placeholder: 'Memory, connection, grief',
    hint: 'Describe the ideas the work explores.',
  },
  contentWarnings: {
    label: 'Content warnings',
    placeholder: 'Flashing lights, injury, grief',
    hint: 'Free-form warnings are shown to readers before mature-content gates.',
  },
  communityLinks: {
    label: 'Community catalog labels',
    placeholder: 'Motion comics, experimental narrative',
    hint: 'Local catalog metadata only. This does not join or submit the work to a community.',
  },
};

function MetadataListInput({
  field,
  hint,
  label,
  onCommit,
  onEnd,
  placeholder,
  project,
}: {
  field: MetadataListField;
  hint: string;
  label: string;
  onCommit: MotusWorkDetailsDialogProps['onCommit'];
  onEnd: () => void;
  placeholder: string;
  project: MotusProject;
}) {
  const id = `work-details-${field}`;
  return (
    <label className="work-details-field" htmlFor={id}>
      <span>{label}</span>
      <Input
        defaultValue={project.metadata[field].join(', ')}
        id={id}
        key={`${project.id}:${field}`}
        maxLength={5_000}
        onBlur={(event) => {
          event.currentTarget.value = parseWorkMetadataItems(
            event.currentTarget.value,
          ).join(', ');
          onEnd();
        }}
        onChange={(event) => {
          const values = parseWorkMetadataItems(event.target.value);
          onCommit((draft) => {
            draft.metadata[field] = values;
            if (field === 'contributorNames') {
              draft.creatorName = values[0] ?? '';
            }
          }, `project:metadata:${field}`);
        }}
        placeholder={placeholder}
      />
      <small>{hint}</small>
    </label>
  );
}

export function MotusWorkDetailsDialog({
  activeChapterId,
  endHistoryTransaction,
  onCommit,
  onOpenChange,
  open,
  project,
}: MotusWorkDetailsDialogProps) {
  const [tab, setTab] = useState('basics');
  const activeChapter =
    project.chapters.find((chapter) => chapter.id === activeChapterId) ??
    project.chapters[0];
  const scenes = getProjectScenes(project);

  const updateOrigin = (origin: WorkOrigin | null) => {
    onCommit((draft) => {
      draft.metadata = createWorkMetadata(
        { ...draft.metadata, origin },
        draft.creatorName,
      );
    });
  };

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) endHistoryTransaction();
        onOpenChange(nextOpen);
      }}
      open={open}
    >
      <DialogContent className="work-details-dialog">
        <DialogHeader>
          <DialogTitle>Work details</DialogTitle>
          <DialogDescription>
            Edit the metadata readers use to understand, find, and safely open
            this work. Changes stay in the draft until the next revision.
          </DialogDescription>
        </DialogHeader>

        <Tabs onValueChange={setTab} value={tab}>
          <TabsList
            aria-label="Work detail sections"
            className="work-details-tabs"
          >
            <TabsTrigger value="basics">
              <BookOpenText />
              Basics
            </TabsTrigger>
            <TabsTrigger value="discover">
              <Compass />
              Discover
            </TabsTrigger>
            <TabsTrigger value="safety">
              <ShieldCheck />
              Safety &amp; credits
            </TabsTrigger>
          </TabsList>

          <div className="work-details-body">
            <TabsContent className="work-details-panel" value="basics">
              <div className="work-details-section-heading">
                <span>01</span>
                <div>
                  <strong>Identity and reading format</strong>
                  <p>
                    The essential information shown everywhere the work appears.
                  </p>
                </div>
              </div>
              <div className="work-details-grid">
                <label
                  className="work-details-field work-details-span-2"
                  htmlFor="work-details-title"
                >
                  <span>Title</span>
                  <Input
                    id="work-details-title"
                    maxLength={MAX_PROJECT_TITLE_LENGTH}
                    onBlur={endHistoryTransaction}
                    onChange={(event) =>
                      onCommit((draft) => {
                        draft.title = event.target.value;
                      }, 'project:title')
                    }
                    placeholder="Name this work"
                    value={project.title}
                  />
                </label>
                <MetadataListInput
                  field="contributorNames"
                  hint="Lead creator first, followed by every co-creator. Separate names with commas."
                  label="Creators"
                  onCommit={onCommit}
                  onEnd={endHistoryTransaction}
                  placeholder="Lead creator, co-creator"
                  project={project}
                />
                <label
                  className="work-details-field"
                  htmlFor="work-details-chapter"
                >
                  <span>Current chapter</span>
                  <Input
                    id="work-details-chapter"
                    maxLength={MAX_PROJECT_TITLE_LENGTH}
                    onBlur={endHistoryTransaction}
                    onChange={(event) =>
                      onCommit((draft) => {
                        const chapter = draft.chapters.find(
                          (item) => item.id === activeChapter.id,
                        );
                        if (chapter) chapter.title = event.target.value;
                      }, `chapter:${activeChapter.id}:title`)
                    }
                    value={activeChapter.title}
                  />
                </label>
                <label
                  className="work-details-field work-details-span-2"
                  htmlFor="work-details-description"
                >
                  <span>Description</span>
                  <Textarea
                    id="work-details-description"
                    maxLength={MAX_PROJECT_DESCRIPTION_LENGTH}
                    onBlur={endHistoryTransaction}
                    onChange={(event) =>
                      onCommit((draft) => {
                        draft.description = event.target.value;
                      }, 'project:description')
                    }
                    placeholder="What should readers know before they begin?"
                    value={project.description}
                  />
                </label>
                <label
                  className="work-details-field"
                  htmlFor="work-details-format"
                >
                  <span>Reading format</span>
                  <NativeSelect
                    id="work-details-format"
                    onChange={(event) =>
                      onCommit((draft) => {
                        draft.format = event.target.value as MotusProjectFormat;
                      })
                    }
                    value={project.format}
                  >
                    <NativeSelectOption value="vertical-scroll">
                      Vertical scroll
                    </NativeSelectOption>
                    <NativeSelectOption value="page">
                      Page by page
                    </NativeSelectOption>
                    <NativeSelectOption value="spread">
                      Two-page spread
                    </NativeSelectOption>
                  </NativeSelect>
                </label>
                <label
                  className="work-details-field"
                  htmlFor="work-details-language"
                >
                  <span>Language</span>
                  <NativeSelect
                    id="work-details-language"
                    onChange={(event) =>
                      onCommit((draft) => {
                        draft.language = event.target.value;
                      })
                    }
                    value={project.language}
                  >
                    <NativeSelectOption value="en">English</NativeSelectOption>
                    <NativeSelectOption value="tr">Turkish</NativeSelectOption>
                    <NativeSelectOption value="es">Spanish</NativeSelectOption>
                    <NativeSelectOption value="fr">French</NativeSelectOption>
                    <NativeSelectOption value="ja">Japanese</NativeSelectOption>
                  </NativeSelect>
                </label>
                <label
                  className="work-details-field"
                  htmlFor="work-details-page-transition"
                >
                  <span>Page transition</span>
                  <NativeSelect
                    id="work-details-page-transition"
                    onChange={(event) =>
                      onCommit((draft) => {
                        draft.readerPresentation = normalizeReaderPresentation({
                          ...draft.readerPresentation,
                          transition: event.target
                            .value as ReaderTransitionStyle,
                        });
                      })
                    }
                    value={project.readerPresentation.transition}
                  >
                    <NativeSelectOption value="cut">Cut</NativeSelectOption>
                    <NativeSelectOption value="slide">Slide</NativeSelectOption>
                    <NativeSelectOption value="book">
                      Book turn
                    </NativeSelectOption>
                  </NativeSelect>
                </label>
                <label
                  className="work-details-field"
                  htmlFor="work-details-reading-direction"
                >
                  <span>Reading direction</span>
                  <NativeSelect
                    id="work-details-reading-direction"
                    onChange={(event) =>
                      onCommit((draft) => {
                        draft.readerPresentation = normalizeReaderPresentation({
                          ...draft.readerPresentation,
                          direction: event.target.value as ReaderDirection,
                        });
                      })
                    }
                    value={project.readerPresentation.direction}
                  >
                    <NativeSelectOption value="ltr">
                      Left to right
                    </NativeSelectOption>
                    <NativeSelectOption value="rtl">
                      Right to left
                    </NativeSelectOption>
                  </NativeSelect>
                </label>
                <label
                  className="work-details-field"
                  htmlFor="work-details-transition-duration"
                >
                  <span>Transition time (ms)</span>
                  <Input
                    defaultValue={project.readerPresentation.durationMs}
                    disabled={project.readerPresentation.transition === 'cut'}
                    id="work-details-transition-duration"
                    key={`${project.id}:${project.readerPresentation.durationMs}`}
                    max={MAX_READER_TRANSITION_DURATION_MS}
                    min={MIN_READER_TRANSITION_DURATION_MS}
                    onBlur={(event) => {
                      const rawValue = event.currentTarget.value.trim();
                      const candidate = rawValue
                        ? Number(rawValue)
                        : project.readerPresentation.durationMs;
                      const durationMs = normalizeReaderPresentation({
                        ...project.readerPresentation,
                        durationMs: Number.isFinite(candidate)
                          ? candidate
                          : project.readerPresentation.durationMs,
                      }).durationMs;
                      event.currentTarget.value = String(durationMs);
                      if (
                        durationMs !== project.readerPresentation.durationMs
                      ) {
                        onCommit((draft) => {
                          draft.readerPresentation =
                            normalizeReaderPresentation({
                              ...draft.readerPresentation,
                              durationMs,
                            });
                        });
                      }
                      endHistoryTransaction();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.currentTarget.blur();
                    }}
                    step={10}
                    type="number"
                  />
                  <small>
                    {project.readerPresentation.transition === 'cut'
                      ? 'Cut is immediate.'
                      : `${MIN_READER_TRANSITION_DURATION_MS}–${MAX_READER_TRANSITION_DURATION_MS} ms`}
                  </small>
                </label>
              </div>
            </TabsContent>

            <TabsContent className="work-details-panel" value="discover">
              <div className="work-details-section-heading">
                <span>02</span>
                <div>
                  <strong>Discovery and provenance</strong>
                  <p>
                    Flexible labels and an explicit relationship to any source
                    work.
                  </p>
                </div>
              </div>
              <div className="work-details-grid">
                <label
                  className="work-details-field"
                  htmlFor="work-details-status"
                >
                  <span>Completion status</span>
                  <NativeSelect
                    id="work-details-status"
                    onChange={(event) =>
                      onCommit((draft) => {
                        draft.metadata.workStatus =
                          (event.target.value as WorkStatus) || null;
                      })
                    }
                    value={project.metadata.workStatus ?? ''}
                  >
                    <NativeSelectOption value="">
                      Choose status
                    </NativeSelectOption>
                    <NativeSelectOption value="ongoing">
                      Ongoing
                    </NativeSelectOption>
                    <NativeSelectOption value="completed">
                      Completed
                    </NativeSelectOption>
                    <NativeSelectOption value="hiatus">
                      Hiatus
                    </NativeSelectOption>
                  </NativeSelect>
                </label>
                <label
                  className="work-details-field"
                  htmlFor="work-details-origin"
                >
                  <span>Work origin</span>
                  <NativeSelect
                    id="work-details-origin"
                    onChange={(event) =>
                      updateOrigin((event.target.value as WorkOrigin) || null)
                    }
                    value={project.metadata.origin ?? ''}
                  >
                    <NativeSelectOption value="">
                      Choose origin
                    </NativeSelectOption>
                    <NativeSelectOption value="original">
                      Original work
                    </NativeSelectOption>
                    <NativeSelectOption value="motus-fanwork">
                      Fanwork of a Motus work
                    </NativeSelectOption>
                    <NativeSelectOption value="external-fanwork">
                      Fanwork of an external work
                    </NativeSelectOption>
                  </NativeSelect>
                </label>

                {project.metadata.origin === 'motus-fanwork' ? (
                  <label
                    className="work-details-field work-details-span-2"
                    htmlFor="work-details-source-work"
                  >
                    <span>Source Motus work</span>
                    <NativeSelect
                      id="work-details-source-work"
                      onChange={(event) => {
                        const source = MOTUS_LIBRARY_WORKS.find(
                          (work) => work.slug === event.target.value,
                        );
                        onCommit((draft) => {
                          draft.metadata = createWorkMetadata(
                            {
                              ...draft.metadata,
                              sourceWorkSlug: source?.slug ?? null,
                              sourceTitle: source?.title ?? null,
                              sourceCreator: source?.creator ?? null,
                            },
                            draft.creatorName,
                          );
                        });
                      }}
                      value={project.metadata.sourceWorkSlug ?? ''}
                    >
                      <NativeSelectOption value="">
                        Choose a catalog work
                      </NativeSelectOption>
                      {MOTUS_LIBRARY_WORKS.map((work) => (
                        <NativeSelectOption key={work.slug} value={work.slug}>
                          {work.title} · {work.creator}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <small>
                      This local prototype records the source relationship;
                      account-backed backlinks require the platform backend.
                    </small>
                  </label>
                ) : null}

                {project.metadata.origin === 'external-fanwork' ? (
                  <>
                    <label
                      className="work-details-field"
                      htmlFor="work-details-source-title"
                    >
                      <span>External source work</span>
                      <Input
                        id="work-details-source-title"
                        maxLength={160}
                        onBlur={(event) => {
                          const value = event.currentTarget.value.trim();
                          onCommit((draft) => {
                            draft.metadata.sourceTitle = value || null;
                          }, 'project:metadata:source-title');
                          endHistoryTransaction();
                        }}
                        onChange={(event) =>
                          onCommit((draft) => {
                            draft.metadata.sourceTitle =
                              event.target.value || null;
                          }, 'project:metadata:source-title')
                        }
                        placeholder="Source title"
                        value={project.metadata.sourceTitle ?? ''}
                      />
                    </label>
                    <label
                      className="work-details-field"
                      htmlFor="work-details-fandom"
                    >
                      <span>Fandom</span>
                      <Input
                        id="work-details-fandom"
                        maxLength={160}
                        onBlur={(event) => {
                          const value = event.currentTarget.value.trim();
                          onCommit((draft) => {
                            draft.metadata.fandom = value || null;
                          }, 'project:metadata:fandom');
                          endHistoryTransaction();
                        }}
                        onChange={(event) =>
                          onCommit((draft) => {
                            draft.metadata.fandom = event.target.value || null;
                          }, 'project:metadata:fandom')
                        }
                        placeholder="Fandom or source universe"
                        value={project.metadata.fandom ?? ''}
                      />
                    </label>
                    <label
                      className="work-details-field work-details-span-2"
                      htmlFor="work-details-source-creator"
                    >
                      <span>Original creator or rights holder</span>
                      <Input
                        id="work-details-source-creator"
                        maxLength={160}
                        onBlur={(event) => {
                          const value = event.currentTarget.value.trim();
                          onCommit((draft) => {
                            draft.metadata.sourceCreator = value || null;
                          }, 'project:metadata:source-creator');
                          endHistoryTransaction();
                        }}
                        onChange={(event) =>
                          onCommit((draft) => {
                            draft.metadata.sourceCreator =
                              event.target.value || null;
                          }, 'project:metadata:source-creator')
                        }
                        placeholder="Optional source credit"
                        value={project.metadata.sourceCreator ?? ''}
                      />
                    </label>
                  </>
                ) : null}

                {(
                  Object.keys(metadataFieldCopy) as Array<
                    keyof typeof metadataFieldCopy
                  >
                )
                  .filter((field) => field !== 'contentWarnings')
                  .map((field) => (
                    <MetadataListInput
                      field={field}
                      hint={metadataFieldCopy[field].hint}
                      key={field}
                      label={metadataFieldCopy[field].label}
                      onCommit={onCommit}
                      onEnd={endHistoryTransaction}
                      placeholder={metadataFieldCopy[field].placeholder}
                      project={project}
                    />
                  ))}
                <label
                  className="work-details-field work-details-span-2"
                  htmlFor="work-details-tags"
                >
                  <span>Search tags</span>
                  <Input
                    defaultValue={project.tags.join(', ')}
                    id="work-details-tags"
                    key={`${project.id}:tags`}
                    maxLength={400}
                    onBlur={(event) => {
                      event.currentTarget.value = parseProjectTags(
                        event.currentTarget.value,
                      ).join(', ');
                      endHistoryTransaction();
                    }}
                    onChange={(event) => {
                      const tags = parseProjectTags(event.target.value);
                      onCommit((draft) => {
                        draft.tags = tags;
                      }, 'project:tags');
                    }}
                    placeholder="mystery, science fiction"
                  />
                  <small>Short search labels · up to 8 tags.</small>
                </label>
              </div>
            </TabsContent>

            <TabsContent className="work-details-panel" value="safety">
              <div className="work-details-section-heading">
                <span>03</span>
                <div>
                  <strong>Safety, credits, and cover</strong>
                  <p>
                    Keep warnings separate from the audience rating and verify
                    every creator credit.
                  </p>
                </div>
              </div>
              <div className="work-details-grid">
                <label
                  className="work-details-field"
                  htmlFor="work-details-rating"
                >
                  <span>Content rating</span>
                  <NativeSelect
                    id="work-details-rating"
                    onChange={(event) =>
                      onCommit((draft) => {
                        draft.contentRating = event.target
                          .value as ContentRating;
                      })
                    }
                    value={project.contentRating}
                  >
                    <NativeSelectOption value="all-ages">
                      General
                    </NativeSelectOption>
                    <NativeSelectOption value="teen">Teen</NativeSelectOption>
                    <NativeSelectOption value="mature">
                      Mature
                    </NativeSelectOption>
                    <NativeSelectOption value="adults-only">
                      Adults only
                    </NativeSelectOption>
                  </NativeSelect>
                </label>
                <label
                  className="work-details-field"
                  htmlFor="work-details-cover"
                >
                  <span>Cover scene</span>
                  <NativeSelect
                    id="work-details-cover"
                    onChange={(event) =>
                      onCommit((draft) => {
                        draft.coverSceneId = event.target.value;
                      })
                    }
                    value={project.coverSceneId}
                  >
                    {project.chapters.flatMap((chapter, chapterIndex) =>
                      chapter.scenes.map((scene, sceneIndex) => (
                        <NativeSelectOption key={scene.id} value={scene.id}>
                          C{chapterIndex + 1} · {sceneIndex + 1} · {scene.name}
                        </NativeSelectOption>
                      )),
                    )}
                  </NativeSelect>
                  <small>{scenes.length} scenes available.</small>
                </label>
                <div className="work-details-span-2">
                  <MetadataListInput
                    field="contentWarnings"
                    hint={metadataFieldCopy.contentWarnings.hint}
                    label={metadataFieldCopy.contentWarnings.label}
                    onCommit={onCommit}
                    onEnd={endHistoryTransaction}
                    placeholder={metadataFieldCopy.contentWarnings.placeholder}
                    project={project}
                  />
                </div>
                <div className="work-details-credit-review work-details-span-2">
                  <strong>Creator credit order</strong>
                  {project.metadata.contributorNames.length ? (
                    <ol>
                      {project.metadata.contributorNames.map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ol>
                  ) : (
                    <p>
                      No creator credit yet. Add one in Basics before
                      publishing.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="work-details-actions">
          <span>Saved to this local draft as you edit.</span>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
