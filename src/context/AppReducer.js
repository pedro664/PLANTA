// AppReducer.js - Reducer and actions for app state management

// Action types
export const ACTION_TYPES = {
  SET_USER: 'SET_USER',
  ADD_PLANT: 'ADD_PLANT',
  UPDATE_PLANT: 'UPDATE_PLANT',
  DELETE_PLANT: 'DELETE_PLANT',
  ADD_CARE_LOG: 'ADD_CARE_LOG',
  ADD_POST: 'ADD_POST',
  TOGGLE_LIKE: 'TOGGLE_LIKE',
  ADD_COMMENT: 'ADD_COMMENT',
  SET_FILTER: 'SET_FILTER',
  SET_LOADING: 'SET_LOADING',
  SET_OFFLINE: 'SET_OFFLINE',
  LOAD_DATA: 'LOAD_DATA',
};

// Initial state with mock data
export const initialState = {
  user: {
    id: 'user-1',
    name: 'Maria Silva',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100&h=100',
    joinDate: '2023-01-15T00:00:00.000Z',
    xp: 850,
    level: 'Jardineira Experiente',
    stats: {
      totalPlants: 12,
      activeDays: 85,
      badges: ['first-plant', 'green-thumb', 'community-helper'],
    },
  },
  plants: [
    {
      id: 'plant-1',
      name: 'Monstera Deliciosa',
      scientific: 'Monstera deliciosa',
      image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=300&h=300',
      description: 'Uma planta tropical linda com folhas grandes e fenestradas.',
      waterFrequency: 'weekly',
      lightNeeds: 'indirect',
      status: 'fine',
      isPublic: true,
      createdAt: '2023-11-01T00:00:00.000Z',
      lastWatered: '2023-12-08T00:00:00.000Z',
      careLogs: [
        {
          id: 'log-1',
          date: '2023-12-08T00:00:00.000Z',
          type: 'water',
          notes: 'Regada pela manhã',
        },
        {
          id: 'log-2',
          date: '2023-12-05T00:00:00.000Z',
          type: 'fertilize',
          notes: 'Adubação com NPK',
        },
      ],
      tips: [
        'Mantenha o solo levemente úmido',
        'Evite sol direto',
        'Limpe as folhas regularmente',
      ],
      comments: [
        {
          id: 'comment-1',
          userId: 'user-2',
          userName: 'João Santos',
          text: 'Que planta linda! Parabéns!',
          date: '2023-12-07T00:00:00.000Z',
        },
      ],
    },
    {
      id: 'plant-2',
      name: 'Espada de São Jorge',
      scientific: 'Sansevieria trifasciata',
      image: 'https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?auto=format&fit=crop&q=80&w=300&h=300',
      description: 'Planta resistente e purificadora de ar.',
      waterFrequency: 'every3days',
      lightNeeds: 'shade',
      status: 'thirsty',
      isPublic: false,
      createdAt: '2023-10-15T00:00:00.000Z',
      lastWatered: '2023-12-05T00:00:00.000Z',
      careLogs: [
        {
          id: 'log-3',
          date: '2023-12-05T00:00:00.000Z',
          type: 'water',
          notes: 'Rega moderada',
        },
      ],
      tips: [
        'Regue com moderação',
        'Tolera pouca luz',
        'Cuidado com excesso de água',
      ],
      comments: [],
    },
    {
      id: 'plant-3',
      name: 'Pothos',
      scientific: 'Epipremnum aureum',
      image: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&q=80&w=300&h=300',
      description: 'Planta pendente ideal para iniciantes.',
      waterFrequency: 'weekly',
      lightNeeds: 'indirect',
      status: 'fine',
      isPublic: true,
      createdAt: '2023-11-20T00:00:00.000Z',
      lastWatered: '2023-12-09T00:00:00.000Z',
      careLogs: [
        {
          id: 'log-4',
          date: '2023-12-09T00:00:00.000Z',
          type: 'water',
          notes: 'Regada e borrifada',
        },
      ],
      tips: [
        'Muito fácil de cuidar',
        'Pode ser propagada facilmente',
        'Gosta de umidade',
      ],
      comments: [],
    },
  ],
  posts: [
    {
      id: 'post-1',
      userId: 'user-2',
      userName: 'João Santos',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=50&h=50',
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400&h=300',
      description: 'Meu jardim está ficando lindo! Dicas para quem está começando: comece com plantas fáceis como pothos e espada de são jorge.',
      category: 'tips',
      likes: 34,
      likedBy: ['user-1', 'user-3', 'user-4'],
      comments: [
        {
          id: 'comment-2',
          userId: 'user-1',
          userName: 'Maria Silva',
          text: 'Que jardim maravilhoso! Obrigada pelas dicas.',
          date: '2023-12-09T10:30:00.000Z',
        },
      ],
      createdAt: '2023-12-09T08:00:00.000Z',
    },
    {
      id: 'post-2',
      userId: 'user-3',
      userName: 'Ana Costa',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=50&h=50',
      image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=400&h=300',
      description: 'Alguém sabe que planta é essa? Encontrei na casa da minha avó.',
      category: 'identification',
      likes: 12,
      likedBy: ['user-2'],
      comments: [
        {
          id: 'comment-3',
          userId: 'user-2',
          userName: 'João Santos',
          text: 'Parece ser uma Begônia! Linda planta.',
          date: '2023-12-09T14:15:00.000Z',
        },
      ],
      createdAt: '2023-12-09T13:45:00.000Z',
    },
  ],
  filters: {
    plants: 'all', // 'all' | 'attention'
    community: 'all', // 'all' | 'tips' | 'identification'
  },
  isLoading: false,
  isOffline: false,
};

// Reducer function
export const appReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_USER:
      return {
        ...state,
        user: action.payload,
      };

    case ACTION_TYPES.ADD_PLANT:
      return {
        ...state,
        plants: [...state.plants, action.payload],
        user: {
          ...state.user,
          stats: {
            ...state.user.stats,
            totalPlants: state.user.stats.totalPlants + 1,
          },
        },
      };

    case ACTION_TYPES.UPDATE_PLANT:
      return {
        ...state,
        plants: state.plants.map(plant =>
          plant.id === action.payload.id ? { ...plant, ...action.payload } : plant
        ),
      };

    case ACTION_TYPES.DELETE_PLANT:
      return {
        ...state,
        plants: state.plants.filter(plant => plant.id !== action.payload),
        user: {
          ...state.user,
          stats: {
            ...state.user.stats,
            totalPlants: Math.max(0, state.user.stats.totalPlants - 1),
          },
        },
      };

    case ACTION_TYPES.ADD_CARE_LOG:
      return {
        ...state,
        plants: state.plants.map(plant => {
          if (plant.id === action.payload.plantId) {
            const updatedPlant = {
              ...plant,
              careLogs: [...plant.careLogs, action.payload.log],
            };
            
            // Update plant status based on care type
            if (action.payload.log.type === 'water') {
              updatedPlant.lastWatered = action.payload.log.date;
              updatedPlant.status = 'fine';
            }
            
            return updatedPlant;
          }
          return plant;
        }),
      };

    case ACTION_TYPES.ADD_POST:
      return {
        ...state,
        posts: [action.payload, ...state.posts],
      };

    case ACTION_TYPES.TOGGLE_LIKE:
      return {
        ...state,
        posts: state.posts.map(post => {
          if (post.id === action.payload.postId) {
            const isLiked = post.likedBy.includes(action.payload.userId);
            return {
              ...post,
              likes: isLiked ? post.likes - 1 : post.likes + 1,
              likedBy: isLiked
                ? post.likedBy.filter(id => id !== action.payload.userId)
                : [...post.likedBy, action.payload.userId],
            };
          }
          return post;
        }),
      };

    case ACTION_TYPES.ADD_COMMENT:
      return {
        ...state,
        posts: state.posts.map(post => {
          if (post.id === action.payload.postId) {
            return {
              ...post,
              comments: [...(post.comments || []), action.payload.comment],
            };
          }
          return post;
        }),
      };

    case ACTION_TYPES.SET_FILTER:
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.type]: action.payload.value,
        },
      };

    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case ACTION_TYPES.SET_OFFLINE:
      return {
        ...state,
        isOffline: action.payload,
      };

    case ACTION_TYPES.LOAD_DATA:
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
};