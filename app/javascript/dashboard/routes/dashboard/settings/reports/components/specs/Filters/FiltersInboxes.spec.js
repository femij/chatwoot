import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ReportsFiltersInboxes from '../../Filters/Inboxes.vue';

const mountParams = {
  global: {
    mocks: {
      $t: msg => msg,
    },
    stubs: ['multiselect'],
  },
};

describe('ReportsFiltersInboxes.vue', () => {
  let store;
  let inboxesModule;

  beforeEach(() => {
    inboxesModule = {
      namespaced: true,
      getters: {
        getInboxes: () => () => [
          { id: 1, name: 'Inbox 1' },
          { id: 2, name: 'Inbox 2' },
        ],
      },
      actions: {
        get: vi.fn(),
      },
    };

    store = createStore({
      modules: {
        inboxes: inboxesModule,
      },
    });
  });

  it('dispatches "inboxes/get" action when component is mounted', () => {
    shallowMount(ReportsFiltersInboxes, {
      global: {
        plugins: [store],
        ...mountParams.global,
      },
    });
    expect(inboxesModule.actions.get).toHaveBeenCalled();
  });

  it('emits "inbox-filter-selection" event when handleInput is called', async () => {
    const wrapper = shallowMount(ReportsFiltersInboxes, {
      global: {
        plugins: [store],
        ...mountParams.global,
      },
    });

    const selectedInbox = { id: 1, name: 'Inbox 1' };
    wrapper.vm.selectedOption = selectedInbox;

    await wrapper.vm.handleInput();

    expect(wrapper.emitted('inboxFilterSelection')).toBeTruthy();
    expect(wrapper.emitted('inboxFilterSelection')[0]).toEqual([selectedInbox]);
  });

  it('passes the correct "multiple" prop to multiselect component', () => {
    const wrapper = shallowMount(ReportsFiltersInboxes, {
      global: {
        plugins: [store],
        ...mountParams.global,
      },
      propsData: {
        multiple: true,
      },
    });

    const multiselect = wrapper.findComponent({ name: 'multiselect' });
    const attributes = multiselect.attributes();
    expect(attributes.multiple).toBe('true');
  });
});
