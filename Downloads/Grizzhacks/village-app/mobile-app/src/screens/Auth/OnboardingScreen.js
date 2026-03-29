import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native'

import { getQuestions, saveAnswers, updateProfile } from '../../api/api'

const CATEGORY_META = {
  basic_info: { step: 1, label: '👋 Basic Info' },
  children_info: { step: 2, label: '👶 Children Info' },
  preferences: { step: 3, label: '🌱 Parenting Preferences' },
  personal: { step: 4, label: '💛 Personal Preferences' },
}

const TYPE_MAP = {
  single_choice: 'single',
  multi_choice: 'multi',
  text: 'text',
}

function parseOptions(optionsJson) {
  if (Array.isArray(optionsJson)) {
    return optionsJson
  }

  if (typeof optionsJson === 'string') {
    try {
      const parsed = JSON.parse(optionsJson)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  return null
}

function mapQuestion(q) {
  const meta = CATEGORY_META[q.category] ?? { step: 1, label: q.category }
  const options = parseOptions(q.options_json)

  let placeholder = 'Type your answer'
  let keyboardType = 'default'

  if (q.question_text?.toLowerCase().includes('zip')) {
    placeholder = 'Enter your zip code'
    keyboardType = 'number-pad'
  }

  if (q.question_type === 'text' && q.category === 'personal') {
    placeholder = 'Tell us a little about yourself'
  }

  return {
    id: q.question_id,
    step: meta.step,
    category: meta.label,
    text: q.question_text,
    type: TYPE_MAP[q.question_type] ?? 'text',
    options,
    required: !!q.required,
    hasOther: options?.includes('Other') ?? false,
    placeholder,
    keyboardType,
  }
}

export default function OnboardingScreen({ user, onComplete }) {
  const [questions, setQuestions] = useState([])
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState({})
  const [otherText, setOtherText] = useState({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadQuestions() {
      try {
        const data = await getQuestions()
        const mapped = Array.isArray(data) ? data.map(mapQuestion) : []
        setQuestions(mapped)
      } catch {
        setError('Could not load onboarding questions')
      } finally {
        setFetching(false)
      }
    }

    loadQuestions()
  }, [])

  const totalSteps = Object.keys(CATEGORY_META).length
  const stepQuestions = questions.filter((q) => q.step === step)

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  function toggleMulti(questionId, option) {
    const current = Array.isArray(answers[questionId]) ? answers[questionId] : []

    const updated = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option]

    setAnswer(questionId, updated)
  }

  function getFinalAnswer(q) {
    const currentAnswer = answers[q.id]

    if (q.type === 'single') {
      if (q.hasOther && currentAnswer === 'Other') {
        return otherText[q.id]?.trim() || 'Other'
      }

      return currentAnswer ?? ''
    }

    if (q.type === 'multi') {
      const selected = Array.isArray(currentAnswer) ? [...currentAnswer] : []

      if (q.hasOther && selected.includes('Other')) {
        const customOther = otherText[q.id]?.trim()

        if (customOther) {
          return selected.map((item) => (item === 'Other' ? customOther : item))
        }
      }

      return selected
    }

    if (q.type === 'text') {
      return typeof currentAnswer === 'string' ? currentAnswer.trim() : ''
    }

    return currentAnswer ?? ''
  }

  function isQuestionAnswered(q) {
    if (!q.required) {
      return true
    }

    const finalAnswer = getFinalAnswer(q)

    if (q.type === 'text') {
      return typeof finalAnswer === 'string' && finalAnswer.length > 0
    }

    if (q.type === 'single') {
      return !!finalAnswer
    }

    if (q.type === 'multi') {
      return Array.isArray(finalAnswer) && finalAnswer.length > 0
    }

    return true
  }

  function isStepComplete() {
    return stepQuestions.every(isQuestionAnswered)
  }

  async function handleFinish() {
    setLoading(true)
    setError('')

    try {
      const formatted = questions
        .map((q) => {
          const finalAnswer = getFinalAnswer(q)

          if (q.type === 'multi') {
            if (!Array.isArray(finalAnswer) || finalAnswer.length === 0) {
              return null
            }

            return {
              question_id: q.id,
              answer_text: finalAnswer.join(', '),
            }
          }

          if (!finalAnswer) {
            return null
          }

          return {
            question_id: q.id,
            answer_text: finalAnswer,
          }
        })
        .filter(Boolean)

      await saveAnswers(user.user_id, formatted)

      const zipQuestion = questions.find(
        (q) => q.category === '👋 Basic Info' && q.text.toLowerCase().includes('zip')
      )

      const mentorQuestion = questions.find((q) =>
        q.text.toLowerCase().includes('mentor')
      )

      const zipAnswer = zipQuestion ? getFinalAnswer(zipQuestion) : ''
      const mentorAnswer = mentorQuestion ? getFinalAnswer(mentorQuestion) : ''

      const is_mentor =
        mentorAnswer === 'Be a mentor' || mentorAnswer === 'Both'

      await updateProfile(user.user_id, {
        name: user.name,
        zipcode: typeof zipAnswer === 'string' ? zipAnswer : '',
        is_mentor,
      })

      onComplete()
    } catch (err) {
      console.error('Failed to save answers:', err)
      setError('Could not save onboarding answers')
    } finally {
      setLoading(false)
    }
  }

  function handleNext() {
    if (!isStepComplete()) {
      return
    }

    if (step < totalSteps) {
      setStep(step + 1)
      return
    }

    handleFinish()
  }

  if (fetching) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    )
  }

  return (
    <SafeAreaView style={s.shell}>
      <View style={s.progressWrap}>
        <View style={s.progressTrack}>
          <View
            style={[
              s.progressFill,
              { width: `${(step / totalSteps) * 100}%` },
            ]}
          />
        </View>
        <Text style={s.progressLabel}>
          Step {step} of {totalSteps}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.stepCategory}>
          {stepQuestions[0]?.category ?? 'Onboarding'}
        </Text>

        {error ? <Text style={s.error}>{error}</Text> : null}

        {stepQuestions.length === 0 ? (
          <View style={s.questionBlock}>
            <Text style={s.questionText}>No questions found for this step.</Text>
          </View>
        ) : null}

        {stepQuestions.map((q) => (
          <View key={q.id} style={s.questionBlock}>
            <Text style={s.questionText}>{q.text}</Text>

            {q.type === 'text' && (
              <TextInput
                style={s.textInput}
                placeholder={q.placeholder}
                placeholderTextColor="#B0B4C8"
                value={answers[q.id] ?? ''}
                onChangeText={(value) => setAnswer(q.id, value)}
                keyboardType={q.keyboardType ?? 'default'}
              />
            )}

            {q.type === 'single' && (
              <View style={s.optionsList}>
                {(q.options ?? []).map((opt) => {
                  const selected = answers[q.id] === opt
                  const isOther = opt === 'Other' && q.hasOther

                  return (
                    <View key={opt}>
                      <TouchableOpacity
                        style={[s.option, selected && s.optionSelected]}
                        onPress={() => setAnswer(q.id, opt)}
                        activeOpacity={0.75}
                      >
                        <View style={[s.radio, selected && s.radioSelected]} />
                        <Text
                          style={[
                            s.optionText,
                            selected && s.optionTextSelected,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>

                      {isOther && selected && (
                        <TextInput
                          style={[s.textInput, { marginTop: 8 }]}
                          placeholder="Please specify..."
                          placeholderTextColor="#B0B4C8"
                          value={otherText[q.id] ?? ''}
                          onChangeText={(value) =>
                            setOtherText((prev) => ({
                              ...prev,
                              [q.id]: value,
                            }))
                          }
                        />
                      )}
                    </View>
                  )
                })}
              </View>
            )}

            {q.type === 'multi' && (
              <View style={s.optionsList}>
                {(q.options ?? []).map((opt) => {
                  const selected = (answers[q.id] ?? []).includes(opt)
                  const isOther = opt === 'Other' && q.hasOther

                  return (
                    <View key={opt}>
                      <TouchableOpacity
                        style={[s.option, selected && s.optionSelected]}
                        onPress={() => toggleMulti(q.id, opt)}
                        activeOpacity={0.75}
                      >
                        <View
                          style={[
                            s.checkbox,
                            selected && s.checkboxSelected,
                          ]}
                        >
                          {selected ? <Text style={s.checkmark}>✓</Text> : null}
                        </View>

                        <Text
                          style={[
                            s.optionText,
                            selected && s.optionTextSelected,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>

                      {isOther && selected && (
                        <TextInput
                          style={[s.textInput, { marginTop: 8 }]}
                          placeholder="Please specify..."
                          placeholderTextColor="#B0B4C8"
                          value={otherText[q.id] ?? ''}
                          onChangeText={(value) =>
                            setOtherText((prev) => ({
                              ...prev,
                              [q.id]: value,
                            }))
                          }
                        />
                      )}
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={s.footer}>
        {step > 1 ? (
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => setStep(step - 1)}
            activeOpacity={0.85}
          >
            <Text style={s.backBtnText}>Back</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[
            s.nextBtn,
            !isStepComplete() && !loading ? { opacity: 0.5 } : null,
            step === 1 ? { flex: 1 } : null,
          ]}
          onPress={handleNext}
          disabled={!isStepComplete() || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.nextBtnText}>
              {step === totalSteps ? 'Finish' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },

  progressWrap: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },

  progressTrack: {
    height: 6,
    backgroundColor: '#EBEBF5',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 6,
  },

  progressLabel: {
    fontSize: 12,
    color: '#8B8FA8',
    textAlign: 'right',
  },

  content: {
    padding: 24,
    paddingBottom: 120,
  },

  stepCategory: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 20,
  },

  error: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 14,
  },

  questionBlock: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  questionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 14,
    lineHeight: 22,
  },

  textInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#EBEBF5',
  },

  optionsList: {
    gap: 8,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EBEBF5',
    backgroundColor: '#FAFAFA',
  },

  optionSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },

  optionText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },

  optionTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },

  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#C4C8D8',
  },

  radioSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C4C8D8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkboxSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },

  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#F5F7FA',
    borderTopWidth: 1,
    borderTopColor: '#EBEBF5',
  },

  backBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EBEBF5',
    backgroundColor: '#fff',
  },

  backBtnText: {
    color: '#1A1A2E',
    fontSize: 15,
    fontWeight: '600',
  },

  nextBtn: {
    flex: 2,
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  nextBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
})