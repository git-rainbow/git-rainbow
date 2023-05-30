function data() {
  function getThemeFromLocalStorage() {
    // if user already changed the theme, use it
    if (window.localStorage.getItem('dark')) {
      return JSON.parse(window.localStorage.getItem('dark'))
    }

    // else return their preferences
    return (
      !!window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    )
  }

  function setThemeToLocalStorage(value) {
    window.localStorage.setItem('dark', value)
  }

  return {
    dark: getThemeFromLocalStorage(),
    toggleTheme() {
      this.dark = !this.dark
      setThemeToLocalStorage(this.dark)
    },
    isSideMenuOpen: false,
    toggleSideMenu() {
      this.isSideMenuOpen = !this.isSideMenuOpen
    },
    closeSideMenu() {
      this.isSideMenuOpen = false
    },
    isNotificationsMenuOpen: false,
    toggleNotificationsMenu() {
      this.isNotificationsMenuOpen = !this.isNotificationsMenuOpen
    },
    closeNotificationsMenu() {
      this.isNotificationsMenuOpen = false
    },
    isProfileMenuOpen: false,
    toggleProfileMenu() {
      this.isProfileMenuOpen = !this.isProfileMenuOpen
    },
    closeProfileMenu() {
      this.isProfileMenuOpen = false
    },
    isPagesMenuOpen: false,
    togglePagesMenu() {
      this.isPagesMenuOpen = !this.isPagesMenuOpen
    },
    // Modal
    isModalOpen: false,
    isEmailModalOpen: false,
    isProjectModalOpen: false,
    trapCleanup: null,
    trapEmailCleanup: null,
    trapProjectCleanup: null,
    openModal() {
      this.isModalOpen = true
      this.trapCleanup = focusTrap(document.querySelector('#modal'))
    },
    openEmailModal() {
      this.isEmailModalOpen = true
      this.trapEmailCleanup = focusTrap(document.querySelector('#email_modal'))
    },
    openProjectModal() {
      this.isProjectModalOpen = true
      this.trapProjectCleanup = focusTrap(document.querySelector('#project_modal'))
    },
    closeModal() {
      this.isModalOpen = false
      this.trapCleanup()
    },
    closeEmailModal() {
      this.isEmailModalOpen = false
      this.trapEmailCleanup()
    },
    closeProjectModal() {
      this.isProjectModalOpen = false
      this.trapProjectCleanup()
    },
  }
}
